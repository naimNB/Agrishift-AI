export default function LoginCard() {
  return (
    <div className="
    w-full
    max-w-[390px]
    bg-white/10
    backdrop-blur-xl
    border
    border-white/20
    rounded-3xl
    p-8
    text-white
    shadow-2xl
    ">

      <div className="
      text-center
      ">

        <div className="text-5xl" aria-hidden="true">
          🌱
        </div>

        <h2 className="
        text-3xl
        font-bold
        mt-3
        ">
          AgriShift AI
        </h2>

        <p className="text-gray-300">
          Login to manage your farm with AI-powered insights
        </p>

      </div>

      <form
        className="
        mt-8
        "
        onSubmit={(event) => event.preventDefault()}
      >

        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="
          w-full
          p-4
          rounded-xl
          bg-white/10
          border
          border-white/20
          outline-none
          focus:border-green-400
          focus:ring-2
          focus:ring-green-400/50
          "
          placeholder="Email address"
        />

        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="
          w-full
          mt-4
          p-4
          rounded-xl
          bg-white/10
          border
          border-white/20
          outline-none
          focus:border-green-400
          focus:ring-2
          focus:ring-green-400/50
          "
          placeholder="Password"
        />

        <button
          type="submit"
          className="
          w-full
          mt-6
          py-4
          rounded-full
          bg-green-400
          text-black
          font-bold
          hover:bg-green-300
          focus-visible:outline-2
          focus-visible:outline-offset-2
          focus-visible:outline-green-400
          transition
          ">
          Login Now →
        </button>

        <div className="
        flex
        gap-4
        mt-6
        ">

          <button
            type="button"
            className="
            flex-1
            bg-white/10
            py-3
            rounded-xl
            hover:bg-white/20
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-white
            transition
            ">
            Google
          </button>

          <button
            type="button"
            className="
            flex-1
            bg-white/10
            py-3
            rounded-xl
            hover:bg-white/20
            focus-visible:outline-2
            focus-visible:outline-offset-2
            focus-visible:outline-white
            transition
            ">
            Microsoft
          </button>

        </div>

      </form>

    </div>
  )
}