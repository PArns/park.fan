export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Logo/Brand */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
            <span className="text-3xl">🎢</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            park.fan
          </h1>
        </div>

        {/* Construction Message */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-full">
            <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-amber-800 dark:text-amber-200 font-medium">
              Under Construction
            </span>
          </div>
          
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
            Deine ultimative Freizeitpark-Community
          </h2>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
            Wir arbeiten an der besten Plattform für Freizeitpark-Fans. 
            Live-Wartezeiten, Park-Bewertungen und eine Community, die deine Leidenschaft teilt.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Progress</span>
            <span>75%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out animate-pulse" 
                 style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">⏱️</span>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Live Wartezeiten</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Aktuelle Wartezeiten für alle Attraktionen in Echtzeit</p>
          </div>
          
          <div className="p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">🎡</span>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Park-Übersicht</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Alle beliebten Freizeitparks an einem Ort</p>
          </div>
          
          <div className="p-6 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Community</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Teile Erfahrungen mit anderen Park-Fans</p>
          </div>
        </div>

        {/* Creator Credit */}
        <div className="pt-6 mt-8 border-t border-gray-200/50 dark:border-gray-700/50">
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Made with ❤️ by{" "}
            <a 
              href="https://arns.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium underline underline-offset-2 hover:underline-offset-4 transition-all"
            >
              Patrick Arns
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
