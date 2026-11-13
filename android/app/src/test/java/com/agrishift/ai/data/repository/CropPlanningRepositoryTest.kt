package com.agrishift.ai.data.repository

import com.agrishift.ai.data.model.FarmProfile
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class CropPlanningRepositoryTest {

    private lateinit var cropPlanningRepository: CropPlanningRepository

    @Before
    fun setUp() {
        cropPlanningRepository = CropPlanningRepository()
    }

    @Test
    fun testGetRotationPlansReturnsAllFourPlans() {
        val plans = cropPlanningRepository.getRotationPlans("bogura", "ধান", true)
        assertEquals(4, plans.size)

        val planIds = plans.map { it.id }
        assertTrue(planIds.contains("plan_a_mustard_paddy"))
        assertTrue(planIds.contains("plan_b_potato_maize"))
        assertTrue(planIds.contains("plan_c_jute_wheat"))
        assertTrue(planIds.contains("plan_d_legume_enrichment"))
    }

    @Test
    fun testRelevanceOrderingBasedOnIrrigation() {
        // When irrigated, Potato/Maize (Plan B) should be ranked first
        val irrigatedPlans = cropPlanningRepository.getRotationPlans("bogura", "ধান", true)
        assertEquals("plan_b_potato_maize", irrigatedPlans.first().id)

        // When rainfed, Legume enrichment (Plan D) should be ranked first
        val rainfedPlans = cropPlanningRepository.getRotationPlans("bogura", "ধান", false)
        assertEquals("plan_d_legume_enrichment", rainfedPlans.first().id)
    }

    @Test
    fun testRotationPlansHaveValidMetricsAndBilingualSupport() {
        val plans = cropPlanningRepository.getRotationPlans("bogura", "ধান", true)
        for (plan in plans) {
            assertTrue("Suitability score must be 0-100", plan.climateSuitabilityPercent in 0..100)
            assertTrue("Water compatibility must be 0-100", plan.waterCompatibilityPercent in 0..100)
            assertTrue("Diversity score must be 0-100", plan.diversityScorePercent in 0..100)
            assertTrue("Title in Bangla must not be empty", plan.getTitle("bn").isNotBlank())
            assertTrue("Title in English must not be empty", plan.getTitle("en").isNotBlank())
            assertTrue("Sequence in Bangla must not be empty", plan.getSequence("bn").isNotBlank())
            assertTrue("Sequence in English must not be empty", plan.getSequence("en").isNotBlank())
            assertTrue("Rationale must not be empty", plan.getWhySuitable("bn").isNotBlank())
            assertTrue("Soil benefit must not be empty", plan.getSoilBenefit("bn").isNotBlank())
            assertTrue("Scientific basis must not be empty", plan.scientificBasis.isNotBlank())
        }
    }

    @Test
    fun testFeasibilityGatingWithoutIrrigation() {
        val rainfedPlans = cropPlanningRepository.getRotationPlans("bogura", "ধান", false)
        val boroPlan = rainfedPlans.first { it.id == "plan_a_mustard_paddy" }
        assertFalse("Boro rice on rainfed land must be flagged infeasible", boroPlan.isFeasible)
        assertTrue("Constraints must explain the water deficit", boroPlan.constraints.isNotEmpty())
        assertTrue(boroPlan.constraints.first().contains("সেচ সুবিধা না থাকায়"))
    }

    @Test
    fun testGetComparisonItemsBilingualRatingsAndConstraints() {
        val plans = cropPlanningRepository.getRotationPlans("bogura", "ধান", true)
        val comparisonsBn = cropPlanningRepository.getComparisonItems(plans, "bn")
        assertEquals(plans.size, comparisonsBn.size)
        assertTrue(comparisonsBn.any { it.overallRating.contains("আঞ্চলিক নির্দেশিকা") })
        assertTrue(plans.all { it.isOfflineGuidance })

        val comparisonsEn = cropPlanningRepository.getComparisonItems(plans, "en")
        assertEquals(plans.size, comparisonsEn.size)
        assertTrue(comparisonsEn.any { it.overallRating.contains("Regional Guidance") })

        // Rainfed comparison should flag infeasibility
        val rainfedPlans = cropPlanningRepository.getRotationPlans("bogura", "ধান", false)
        val rainfedComparisons = cropPlanningRepository.getComparisonItems(rainfedPlans, "bn")
        val infeasibleItem = rainfedComparisons.first { it.planId == "plan_a_mustard_paddy" }
        assertFalse(infeasibleItem.isFeasible)
        assertTrue(infeasibleItem.overallRating.contains("অনুপযোগী"))
    }

    @Test
    fun testSwitchToOfflineMode() {
        val farm = FarmProfile(districtId = "bogura", currentCrop = "ধান", hasIrrigation = true)
        cropPlanningRepository.switchToOfflineMode(farm)
        val state = cropPlanningRepository.rotationState.value
        assertTrue("State must be Success", state is RotationUiState.Success)
        val success = state as RotationUiState.Success
        assertTrue("Must be marked offline", success.isOffline)
        assertEquals(4, success.plans.size)
    }
}
