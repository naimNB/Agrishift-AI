package com.agrishift.ai.data.model

object AppStrings {

    // App & Navigation
    fun appName(lang: String): String = if (lang == "en") "AgriShift AI" else "AgriShift AI"
    fun appSlogan(lang: String): String = if (lang == "en") "Farmer's Trusted Climate & Crop Advisor" else "কৃষকের বিশ্বস্ত জলবায়ু ও ফসল সহযোগী"
    fun navHome(lang: String): String = if (lang == "en") "Home" else "হোম"
    fun navFarm(lang: String): String = if (lang == "en") "My Farm" else "আমার জমি"
    fun navClimate(lang: String): String = if (lang == "en") "Climate" else "আবহাওয়া"
    fun navRotations(lang: String): String = if (lang == "en") "Crop Plans" else "পরিকল্পনা"
    fun navCompare(lang: String): String = if (lang == "en") "Compare" else "তুলনা"
    fun navSettings(lang: String): String = if (lang == "en") "Settings" else "সেটিংস"
    fun back(lang: String): String = if (lang == "en") "Back" else "ফিরে যান"

    // Home Screen
    fun welcomeFarmer(lang: String): String = if (lang == "en") "Welcome, Farmer!" else "স্বাগতম, কৃষক ভাই!"
    fun homeHeroDesc(lang: String): String = if (lang == "en")
        "Get smart crop rotation and irrigation recommendations powered by NASA Earth observations and regional climate data."
    else
        "NASA-এর রিয়েল-টাইম উপাত্ত ও আবহাওয়া বিশ্লেষণ দিয়ে আপনার জমির জন্য সেরা ফসলের আবর্তন ও সেচ পরিকল্পনা তৈরি করুন।"

    fun activeFarmSummary(lang: String): String = if (lang == "en") "Active Farm Profile" else "আমার জমির বর্তমান তথ্য"
    fun editBtn(lang: String): String = if (lang == "en") "Edit" else "পরিবর্তন"
    fun seasonLabel(lang: String): String = if (lang == "en") "Season" else "মৌসুম"
    fun soilLabel(lang: String): String = if (lang == "en") "Soil" else "মাটি"
    fun irrigationLabel(lang: String): String = if (lang == "en") "Irrigation" else "সেচ"
    fun areaLabel(lang: String): String = if (lang == "en") "Area" else "আয়তন"
    fun irrigatedText(lang: String): String = if (lang == "en") "Irrigated" else "সেচ আছে"
    fun rainfedText(lang: String): String = if (lang == "en") "Rainfed" else "বৃষ্টি নির্ভর"

    fun primaryActionAddFarm(lang: String): String = if (lang == "en") "Add / Edit My Farm" else "আমার জমি যোগ / সম্পাদনা করুন"
    fun fourShortcutsTitle(lang: String): String = if (lang == "en") "Quick Services" else "প্রধান সেবাসমূহ"

    fun shortcutRotationsTitle(lang: String): String = if (lang == "en") "Crop Rotation Planner" else "ফসলের আবর্তন পরিকল্পনা"
    fun shortcutRotationsDesc(lang: String): String = if (lang == "en")
        "Select resilient 3-crop cycles for high yield and healthy soil."
    else
        "আপনার জমির জন্য লাভজনক ও উপযুক্ত ৩-ফসলি শস্যচক্র নির্বাচন করুন।"

    fun shortcutClimateTitle(lang: String): String = if (lang == "en") "NASA Climate Insights" else "NASA আবহাওয়া ও জলবায়ু"
    fun shortcutClimateDesc(lang: String): String = if (lang == "en")
        "Rainfall, humidity, and NASA model-derived root-zone soil wetness."
    else
        "বৃষ্টিপাত, আর্দ্রতা এবং নাসা মডেলের রুট-জোন মাটির আর্দ্রতা জানুন।"

    fun shortcutCompareTitle(lang: String): String = if (lang == "en") "Compare Plans" else "পরিকল্পনাগুলোর তুলনা"
    fun shortcutCompareDesc(lang: String): String = if (lang == "en")
        "Compare rotations by climate suitability, water saving, and soil fertility."
    else
        "জলবায়ু সহনশীলতা, পানির খরচ ও মাটির উর্বরতার ভিত্তিতে তুলনা দেখুন।"

    fun regionalAdvisoryTitle(lang: String): String = if (lang == "en") "Priority Agronomic Advisory" else "আঞ্চলিক কৃষি পরামর্শ"
    fun checkingAdvisory(lang: String): String = if (lang == "en") "Checking regional advisory from NASA data..." else "NASA উপাত্ত থেকে আঞ্চলিক পরামর্শ যাচাই করা হচ্ছে..."

    fun secondarySectionTitle(lang: String): String = if (lang == "en") "More Options & Settings" else "অন্যান্য সেবা ও তথ্য"
    fun customizeDashboardBtn(lang: String): String = if (lang == "en") "Customize Dashboard" else "ড্যাশবোর্ড সাজান"
    fun spaceAppsFooter(lang: String): String = if (lang == "en") "NASA Space Apps Field Shift • Bangladesh Agro Intelligence" else "NASA Space Apps Field Shift • বাংলাদেশ কৃষি পরামর্শ"

    // Farm Profile Screen
    fun farmScreenTitle(lang: String): String = if (lang == "en") "My Farm" else "আমার জমি"
    fun farmScreenSubtitle(lang: String): String = if (lang == "en") "Set farm location and crop details" else "জমির সঠিক অবস্থান ও ফসলের তথ্য দিন"
    fun farmScreenNotice(lang: String): String = if (lang == "en")
        "NASA satellite telemetry and crop guidance are tailored to these farm parameters."
    else
        "আপনার জমির তথ্য অনুযায়ী নাসা স্যাটেলাইট আবহাওয়া ও ফসলের পরামর্শ সমন্বয় করবে।"

    fun selectDistrictLabel(lang: String): String = if (lang == "en") "1. Select District *" else "১. আপনার জেলা নির্বাচন করুন *"
    fun selectDistrictHelper(lang: String): String = if (lang == "en")
        "Available monitoring districts: Bogura, Rangpur, Dinajpur, Rajshahi, Sylhet"
    else
        "উপলব্ধ কৃষি জেলা: বগুড়া, রংপুর, দিনাজপুর, রাজশাহী, সিলেট"

    fun gpsCoordinatesTitle(lang: String): String = if (lang == "en") "2. Farm Geographic Location (GPS)" else "২. জমির ভৌগোলিক অবস্থান (GPS)"
    fun latLabel(lang: String): String = if (lang == "en") "Latitude" else "অক্ষাংশ"
    fun lonLabel(lang: String): String = if (lang == "en") "Longitude" else "দ্রাঘিমাংশ"
    fun getGpsBtn(lang: String): String = if (lang == "en") "Capture GPS Location from Device" else "বর্তমান অবস্থান থেকে জিপিএস নিন"
    fun gpsFetching(lang: String): String = if (lang == "en") "Detecting location..." else "অবস্থান খোঁজা হচ্ছে..."
    fun gpsCapturedDevice(lang: String): String = if (lang == "en") "GPS coordinates captured from device." else "সরাসরি ফোন থেকে জিপিএস অবস্থান নেওয়া হয়েছে।"
    fun gpsFallbackDistrict(lang: String): String = if (lang == "en") "Using district center coordinates." else "অবস্থান অনুমতির অভাবে জেলার মূল স্থানাঙ্ক ব্যবহৃত হচ্ছে।"

    fun currentCropLabel(lang: String): String = if (lang == "en") "3. Current Crop Cultivated *" else "৩. বর্তমান আবাদকৃত ফসল *"
    fun currentCropHelper(lang: String): String = if (lang == "en") "Crop currently standing or planned" else "যে ফসলটি বর্তমানে আপনার জমিতে আবাদ করা আছে বা করতে যাচ্ছেন"

    fun seasonChoiceLabel(lang: String): String = if (lang == "en") "4. Cultivation Season" else "৪. বর্তমান চাষাবাদ মৌসুম"
    fun soilTypeChoiceLabel(lang: String): String = if (lang == "en") "5. Soil Type (Optional)" else "৫. মাটির ধরন (ঐচ্ছিক)"
    fun soilTypeHelper(lang: String): String = if (lang == "en") "Helps calculate precise irrigation needs" else "মাটির ধরন জানা থাকলে সঠিক সেচ ও পুষ্টি পরামর্শ দেওয়া সহজ হয়"

    fun irrigationQuestion(lang: String): String = if (lang == "en") "6. Does the farm have irrigation access?" else "৬. জমিতে সেচের সুবিধা আছে কি?"
    fun irrigationYesTitle(lang: String): String = if (lang == "en") "Yes, Irrigated" else "হ্যাঁ, সেচ আছে"
    fun irrigationYesSub(lang: String): String = if (lang == "en") "Tube-well / Canal" else "নলকূপ / ক্যানাল"
    fun irrigationNoTitle(lang: String): String = if (lang == "en") "No, Rainfed Only" else "না, বৃষ্টি নির্ভর"
    fun irrigationNoSub(lang: String): String = if (lang == "en") "Dependent on rainfall" else "সেচ সুবিধা নেই"

    fun landAreaQuestion(lang: String): String = if (lang == "en") "7. Farm Area (Bigha)" else "৭. জমির পরিমাপ (বিঘা)"
    fun saveFarmDetailsBtn(lang: String): String = if (lang == "en") "Save Farm Details" else "জমির তথ্য সংরক্ষণ করুন"
    fun saveSuccessFeedback(lang: String): String = if (lang == "en") "Farm details saved successfully!" else "জমির বিবরণ সফলভাবে সংরক্ষণ করা হয়েছে!"

    fun validationDistrict(lang: String): String = if (lang == "en") "Please select your district." else "অনুগ্রহ করে আপনার জেলা নির্বাচন করুন।"
    fun validationCrop(lang: String): String = if (lang == "en") "Please select your current crop." else "অনুগ্রহ করে বর্তমান আবাদকৃত ফসল নির্বাচন করুন।"

    fun deviceStorageNoticeTitle(lang: String): String = if (lang == "en") "Secure Local Storage" else "ডিভাইসে নিরাপদ সংরক্ষণ"
    fun deviceStorageNoticeBody(lang: String): String = if (lang == "en")
        "Farm data is safely stored locally on your device. Cloud synchronization requires login."
    else
        "আপনার জমির সব বিবরণ আপনার মোবাইলেই সংরক্ষিত থাকে। ক্লাউড ব্যাকআপের জন্য সার্ভারে লগইন প্রয়োজন।"

    // Climate Insights Screen
    fun climateScreenTitle(lang: String): String = if (lang == "en") "NASA Climate Insights" else "NASA আবহাওয়া ও জলবায়ু"
    fun climateScreenSubtitle(lang: String): String = if (lang == "en") "Agroclimate observations & soil moisture" else "কৃষি পূর্বাভাস ও মাটির আর্দ্রতা বিশ্লেষণ"
    fun historicalObservationBadge(lang: String): String = if (lang == "en")
        "30-Day Historical Agroclimatic Observations"
    else
        "গত ৩০ দিনের ঐতিহাসিক পর্যবেক্ষণ (NASA POWER স্যাটেলাইট উপাত্ত)"

    fun forecastDistinctionNote(lang: String): String = if (lang == "en")
        "Notice: These are verified NASA satellite & hydrological observations of the past 30 days, not forward forecasts."
    else
        "সতর্কতা: এটি বিগত ৩০ দিনের যাচাইকৃত নাসা স্যাটেলাইট ও মৃত্তিকা পর্যবেক্ষণ উপাত্ত, আগামী দিনের পূর্বাভাস নয়।"

    fun avgTemperature(lang: String): String = if (lang == "en") "Avg Temperature" else "গড় তাপমাত্রা"
    fun tempMaxMinStatus(max: String, min: String, lang: String): String = if (lang == "en") "Max: $max° | Min: $min°" else "সর্বোচ্চ: $max° | সর্বনিম্ন: $min°"

    fun rainfall30Days(lang: String): String = if (lang == "en") "Total Rainfall (30d)" else "মোট বৃষ্টিপাত (৩০ দিন)"
    fun humidityTitle(lang: String): String = if (lang == "en") "Air Humidity" else "বাতাসের আর্দ্রতা"
    fun rootZoneWetnessTitle(lang: String): String = if (lang == "en") "Root-Zone Wetness" else "রুট-জোন আর্দ্রতা"
    fun nasaModelDataBadge(lang: String): String = if (lang == "en") "NASA POWER Model-Derived" else "NASA POWER মডেল-উপাত্ত"

    fun expandAdvancedCharts(lang: String): String = if (lang == "en") "Show Advanced Charts & Daily Trend ▼" else "উন্নত গ্রাফ ও দৈনিক গতিপ্রকৃতি দেখুন ▼"
    fun collapseAdvancedCharts(lang: String): String = if (lang == "en") "Hide Advanced Charts ▲" else "গ্রাফ আড়াল করুন ▲"

    fun expandRootZoneExplanation(lang: String): String = if (lang == "en") "How NASA Calculates Root-Zone Moisture ▼" else "রুট-জোন আর্দ্রতা কীভাবে কাজ করে? ▼"
    fun collapseRootZoneExplanation(lang: String): String = if (lang == "en") "Hide Explanation ▲" else "ব্যাখ্যা আড়াল করুন ▲"
    fun rootZoneExplanationBody(lang: String): String = if (lang == "en")
        "GWETROOT represents soil moisture in the 0–100 cm root zone. NASA POWER integrates satellite microwave observations with the Catchment Land Surface Model. Use this to determine Alternate Wetting and Drying (AWD) intervals and avoid water waste."
    else
        "GWETROOT হলো মাটির ০-১০০ সেমি মূল শিকড় স্তরের আর্দ্রতা। নাসা স্যাটেলাইট মাইক্রোওয়েভ উপাত্ত ও ক্যাচমেন্ট ল্যান্ড সারফেস মডেল সমন্বয় করে এটি তৈরি করে। এটি দিয়ে পর্যায়ক্রমিক শুকানো-ভেজানো (AWD) এবং সেচের সময় নির্ধারণ করা যায়।"

    fun expandAllAdvisories(lang: String): String = if (lang == "en") "Show All Field Advisories ▼" else "সবগুলো কৃষি পরামর্শ দেখুন ▼"
    fun collapseAllAdvisories(lang: String): String = if (lang == "en") "Hide Advisories ▲" else "পরামর্শ আড়াল করুন ▲"

    fun retryBtn(lang: String): String = if (lang == "en") "Retry" else "পুনরায় চেষ্টা করুন"

    // Crop Rotation Planner Screen
    fun rotationScreenTitle(lang: String): String = if (lang == "en") "Crop Rotation Planner" else "ফসলের আবর্তন পরিকল্পনা"
    fun rotationScreenSubtitle(lang: String): String = if (lang == "en") "Sustainable crop cycles for soil health and yield" else "মাটির উর্বরতা ও লাভ বৃদ্ধির উপযুক্ত শস্যচক্র"
    fun currentStandingCrop(lang: String): String = if (lang == "en") "Current Crop Standing" else "আপনার বর্তমান শস্য তথ্য"

    fun rotationRationaleTitle(lang: String): String = if (lang == "en") "Why Crop Rotation Matters" else "শস্য আবর্তন কেন প্রয়োজন?"
    fun rotationRationaleBody(lang: String): String = if (lang == "en")
        "Monoculture depletes soil nutrients and increases pest vulnerability. Alternating deep-rooted crops with legumes or oilseeds reduces fertilizer costs, breaks pest cycles, and boosts profitability."
    else
        "একই জমিতে বারবার একই ফসল চাষ করলে মাটির নির্দিষ্ট পুষ্টি নিঃশেষিত হয় ও রোগবালাই বাড়ে। ডাল ও তেলবীজ জাতীয় ফসল পর্যায়ক্রমে চাষ করলে সার খরচ কমে ও লাভ বাড়ে।"

    fun recommendedPlansHeading(lang: String): String = if (lang == "en") "Top Recommended Rotations" else "আপনার এলাকার জন্য সেরা আবর্তনসমূহ"
    fun showMorePlansBtn(lang: String): String = if (lang == "en") "Show More Crop Plans (4 Total) ▼" else "আরও আবর্তন পরিকল্পনা দেখুন (মোট ৪টি) ▼"
    fun showLessPlansBtn(lang: String): String = if (lang == "en") "Show Top 2 Plans Only ▲" else "শুধু সেরা ২টি পরিকল্পনা রাখুন ▲"

    fun recommendationDisclaimerTitle(lang: String): String = if (lang == "en")
        "Agronomic Basis & Limitations"
    else
        "রেটিংয়ের ভিত্তি ও সীমাবদ্ধতা"

    fun recommendationDisclaimerBody(lang: String): String = if (lang == "en")
        "Notice: These compatibility ratings are heuristic agronomic indices based on Bangladesh Agricultural Research Council (BARC) AEZ guidelines and seasonal temperature-moisture thresholds. They are not automated black-box ML predictions. Please verify drainage, soil depth, and local market factors with your Upazila Agriculture Officer."
    else
        "সতর্কতা: এই রেটিংগুলো বাংলাদেশ কৃষি গবেষণা কাউন্সিলের (BARC) কৃষি-পরিবেশ অঞ্চল (AEZ) নির্দেশিকা ও আবহাওয়া সহনশীলতার ভিত্তিতে নির্ধারিত। এটি কোনো চূড়ান্ত এআই ভবিষ্যদ্বাণী নয়—আপনার জমির মাটির গভীরতা ও স্থানীয় বাজার বিবেচনা করে উপজেলা কৃষি কর্মকর্তার পরামর্শ নিন।"

    fun whySuitableHeading(lang: String): String = if (lang == "en") "Why this rotation is suitable:" else "কেন এই আবর্তন উপযুক্ত:"
    fun soilBenefitHeading(lang: String): String = if (lang == "en") "Soil health & nutrients:" else "মাটির স্বাস্থ্য ও উর্বরতা:"
    fun riskHeading(lang: String): String = if (lang == "en") "Risk level:" else "ঝুঁকি:"
    fun compareRotationsAction(lang: String): String = if (lang == "en") "Compare These Plans Side-by-Side" else "পরিকল্পনাগুলোর সরাসরি তুলনা দেখুন"
    fun feasibleBadge(lang: String): String = if (lang == "en") "Recommended & Feasible" else "উপযোগী ও প্রস্তাবিত"
    fun infeasibleBadge(lang: String): String = if (lang == "en") "Infeasible (Constraints Detected)" else "অনুপযোগী (সীমাবদ্ধতা রয়েছে)"
    fun constraintsHeading(lang: String): String = if (lang == "en") "Agronomic Constraints & Warnings:" else "সীমাবদ্ধতা ও সতর্কবার্তা:"
    fun scientificBasisHeading(lang: String): String = if (lang == "en") "Research Basis:" else "গবেষণার ভিত্তি:"
    fun offlineNoticeTitle(lang: String): String = if (lang == "en") "Offline Local Guidance Mode" else "অফলাইন স্থানীয় গাইডলাইন মোড"
    fun offlineNoticeBody(lang: String): String = if (lang == "en")
        "Live NASA satellite connection unavailable. Displaying local BARC AEZ guidelines and verified historical patterns."
    else
        "লাইভ সার্ভার সংযুক্ত না থাকায় স্থানীয় ঐতিহাসিক বার্ক (BARC) এইজেড গাইডলাইন প্রদর্শিত হচ্ছে।"
    fun switchToOfflineBtn(lang: String): String = if (lang == "en") "View Offline BARC Guidelines" else "স্থানীয় অফলাইন গাইডলাইন দেখুন"

    // Compare Plans Screen
    fun compareScreenTitle(lang: String): String = if (lang == "en") "Compare Plans" else "পরিকল্পনা তুলনা করুন"
    fun compareScreenSubtitle(lang: String): String = if (lang == "en") "Simple card comparison of rotation plans" else "সহজ কার্ডে শস্যচক্রের গুণাগুণ তুলনা"
    fun compareIntro(lang: String): String = if (lang == "en")
        "Review climate resilience, water savings, and soil fertility benefits at a glance without complicated charts."
    else
        "কোন শস্য আবর্তনে পানি কতটুকু বাঁচবে, জলবায়ু কতটা অনুকূল এবং মাটির উর্বরতা কেমন বাড়বে তা একনজরে মিলিয়ে দেখুন।"

    fun bestRecommendationTitle(lang: String): String = if (lang == "en") "Best Recommendation for Your Farm" else "আপনার এলাকার জন্য সেরা সুপারিশ"
    fun bestRecIrrigated(lang: String): String = if (lang == "en")
        "With irrigation available, the 'Aman ➔ Potato ➔ Maize' rotation yields highest economic return and fertilizer savings."
    else
        "সেচ সুবিধা থাকায় 'আমন ➔ আলু ➔ ভুট্টা' আবর্তনে সর্বোচ্চ লাভ ও সার সাশ্রয় হবে।"
    fun bestRecRainfed(lang: String): String = if (lang == "en")
        "Under rainfed conditions, the 'Aman ➔ Mungbean ➔ Aus' rotation is safest and enriches soil nitrogen naturally."
    else
        "সেচের সীমাবদ্ধতায় 'আমন ➔ মুগডাল ➔ আউশ' আবর্তন সবচেয়ে নিরাপদ ও লাভজনক।"

    fun climateResilienceMetric(lang: String): String = if (lang == "en") "Climate Resilience" else "জলবায়ু সহনশীলতা"
    fun waterSavingsMetric(lang: String): String = if (lang == "en") "Water Compatibility & Savings" else "পানির সামঞ্জস্য ও সাশ্রয়"
    fun soilDiversityMetric(lang: String): String = if (lang == "en") "Crop Diversity & Soil Health" else "শস্য বৈচিত্র্য ও মাটির উর্বরতা"

    // Settings Screen
    fun settingsScreenTitle(lang: String): String = if (lang == "en") "Settings & Preferences" else "সেটিংস ও তথ্য"
    fun settingsScreenSubtitle(lang: String): String = if (lang == "en") "Language, dashboard, and data sources" else "ভাষা, ড্যাশবোর্ড ও তথ্যের উৎস"

    fun languageChoiceTitle(lang: String): String = if (lang == "en") "Language (ভাষা নির্বাচন)" else "ভাষা নির্বাচন (Language Preferences)"
    fun dashboardCustomizationTitle(lang: String): String = if (lang == "en") "Dashboard Customization" else "ড্যাশবোর্ড সাজান (Dashboard Customization)"
    fun dashboardCustomizationDesc(lang: String): String = if (lang == "en")
        "Choose which optional shortcuts appear on your Home Screen:"
    else
        "হোম স্ক্রিনে কোন কোন শর্টকাট দেখতে চান তা নির্বাচন করুন:"

    fun toggleRotationsShortcut(lang: String): String = if (lang == "en") "Crop Rotation Planner Shortcut" else "ফসলের আবর্তন শর্টকাট"
    fun toggleClimateShortcut(lang: String): String = if (lang == "en") "NASA Climate Shortcut" else "NASA আবহাওয়া শর্টকাট"
    fun toggleCompareShortcut(lang: String): String = if (lang == "en") "Compare Plans Shortcut" else "পরিকল্পনা তুলনা শর্টকাট"
    fun toggleAdvisoryBanner(lang: String): String = if (lang == "en") "Priority Advisory Alert Banner" else "জরুরি কৃষি পরামর্শ ব্যানার"

    fun dataSourcesTitle(lang: String): String = if (lang == "en") "Data Sources & Integrity" else "তথ্যের উৎস ও নির্ভরযোগ্যতা"
    fun privacyTitle(lang: String): String = if (lang == "en") "Farmer Data Privacy" else "কৃষকের তথ্যের গোপনীয়তা ও সুরক্ষা"
    fun privacyBulletPoints(lang: String): String = if (lang == "en")
        "• GPS coordinates and farm profile are stored locally on your device.\n• No farm data is sold or shared with commercial third parties.\n• AgriShift AI does not access personal files or contacts."
    else
        "• আপনার জমির অবস্থান (GPS) এবং ফসলের তথ্য সম্পূর্ণ আপনার মোবাইলে নিরাপদে সংরক্ষিত থাকে।\n• আপনার অনুমতি ব্যতীত কোনো বাণিজ্যিক তৃতীয় পক্ষের কাছে তথ্য আদান-প্রদান করা হয় না।\n• অ্যাপটি কোনো অপ্রয়োজনীয় ব্যক্তিগত তথ্য বা ডিভাইসের সংবেদনশীল ফাইল এক্সেস করে না।"

    fun backendStatusTitle(lang: String): String = if (lang == "en") "Backend Connectivity & Server URL" else "সার্ভার সংযোগ ও কনফিগারেশন"
    fun testServerBtn(lang: String): String = if (lang == "en") "Test Server Connection" else "সার্ভার সংযোগ পরীক্ষা করুন"
    fun testingServer(lang: String): String = if (lang == "en") "Testing connection..." else "সংযোগ পরীক্ষা করা হচ্ছে..."
    fun serverConnected(lang: String): String = if (lang == "en") "Backend server connected & active (Status: OK)" else "ব্যাকএন্ড সার্ভার সক্রিয় ও সচল (Status: OK)"
    fun serverFailed(lang: String): String = if (lang == "en") "Connection failed. Please ensure backend is running or use offline mode." else "সার্ভারে সংযোগ ব্যর্থ হয়েছে। সার্ভার চালু আছে কি না পরীক্ষা করুন অথবা অফলাইন মোড ব্যবহার করুন।"

    fun serverConfigTitle(lang: String): String = if (lang == "en") "Configurable Backend Server" else "সার্ভার ঠিকানা নির্বাচন করুন"
    fun serverUrlLabel(lang: String): String = if (lang == "en") "Active Endpoint URL:" else "বর্তমান সার্ভার ঠিকানা:"
    fun presetProductionCloud(lang: String): String = if (lang == "en") "Cloud (Not Configured)" else "ক্লাউড (কনফিগার করা হয়নি)"
    fun presetAdbReverse(lang: String): String = if (lang == "en") "USB Dev Only (127.0.0.1)" else "ইউএসবি ডেভ (127.0.0.1)"
    fun presetEmulator(lang: String): String = if (lang == "en") "Emulator Dev (10.0.2.2)" else "ইমুলেটর ডেভ (১০.০.২.২)"
    fun serverNotConfiguredWarning(lang: String): String = if (lang == "en")
        "No production cloud server is currently deployed or configured. To connect to an online backend, enter a verified HTTPS address. Otherwise, local offline mode remains fully operational."
    else
        "বর্তমানে কোনো ক্লাউড সার্ভার ডেপ্লয় বা কনফিগার করা নেই। লাইভ সার্ভার সংযোগ পেতে একটি যাচাইকৃত HTTPS ঠিকানা দিন। অন্যথায় স্থানীয় অফলাইন মোডে সাধারণ আঞ্চলিক গাইডলাইন সম্পূর্ণ কার্যকর থাকবে।"
    fun saveServerUrlBtn(lang: String): String = if (lang == "en") "Save Server Address" else "সার্ভার ঠিকানা সংরক্ষণ করুন"
    fun serverUrlSaved(lang: String): String = if (lang == "en") "Server URL saved and applied!" else "সার্ভার ঠিকানা সফলভাবে সংরক্ষিত ও কার্যকর হয়েছে!"
    fun offlineBannerHelp(lang: String): String = if (lang == "en")
        "You are operating independently in offline mode. General BARC AEZ regional guidelines remain accessible without internet or USB connection."
    else
        "আপনি অফলাইন মোডে অ্যাপটি ব্যবহার করছেন। ইন্টারনেট বা ইউএসবি সংযোগ ছাড়াই সাধারণ বার্ক (BARC) এইজেড আঞ্চলিক গাইডলাইন কার্যকর থাকবে।"
}
