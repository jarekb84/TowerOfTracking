export function TotalsAnalysis() {
  return (
    <div className="flex items-center justify-center min-h-[32rem] sm:min-h-[36rem] px-4 py-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center border border-purple-500/30 shadow-lg shadow-purple-500/10">
            <svg
              className="w-14 h-14 sm:w-16 sm:h-16 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100">
            Totals Analysis - Coming Soon!
          </h2>
          <p className="text-base sm:text-lg text-slate-400">
            Analyze the sources of your aggregate metrics
          </p>
        </div>

        <div className="space-y-6 text-slate-300">
          <p className="text-sm sm:text-base">
            This page will allow you to analyze the breakdown of aggregate metrics like damage dealt and coin income:
          </p>

          <ul className="text-left space-y-3 max-w-xl mx-auto text-sm sm:text-base">
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1 font-bold">•</span>
              <span>Damage dealt breakdown (orb damage, thorn damage, chain lightning, etc.)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1 font-bold">•</span>
              <span>Coin income sources (golden tower, black hole, spotlight, upgrades, etc.)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1 font-bold">•</span>
              <span>Enemy type breakdown (total enemies killed by type)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-purple-400 mt-1 font-bold">•</span>
              <span>Potentially more metrics where data breakdown is available</span>
            </li>
          </ul>

          <p className="pt-2 text-sm sm:text-base text-slate-400">
            Stay tuned for timeline charts, pie charts, and detailed source breakdowns
            to help you optimize your strategy.
          </p>
        </div>

        <div className="pt-4">
          <a
            href="https://discord.gg/J444xGFbTt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/30 hover:border-purple-400/50 text-purple-200 hover:text-purple-100 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-purple-500/20 text-sm sm:text-base"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Join Discord to Request Features
          </a>
        </div>
      </div>
    </div>
  )
}
