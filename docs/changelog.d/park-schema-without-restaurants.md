### Parkseiten: Restaurants nicht mehr in den strukturierten Daten

Das JSON-LD einer Parkseite listete neben jeder Bahn auch jedes Restaurant als `FoodEstablishment`, bei Walibi Holland 63 Stück. Danach sucht niemand eine Wartezeiten-Seite ab, und es machte das HTML für Crawler schwerer, ohne eine Frage zu beantworten. `containsPlace` nennt jetzt nur noch die Bahnen. Die Restaurants auf der Seite selbst bleiben.
