### Die Regionen im Planen-Menü öffnen den Hub oben

Eine Region im Planen-Band des Headers und im Handy-Menü führte auf `/<region>#planner` und scrollte
damit an Frage, Antwort und Kalender vorbei zum Planer. Sie führt jetzt auf den Hub selbst
(`getPlannerMenu` in `lib/navigation/planner-menu.ts`), der oben beginnt. Der Footer behält `#planner`.
