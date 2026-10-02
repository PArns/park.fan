### Escape im Menüband lässt den Fokus in einem Feld der Seite stehen

Ein Menüband im Header öffnet auch per Hover. Stand der Zeiger auf einem Auslöser, während jemand im Ride-Filter einer Parkseite tippte, leerte Escape den Filter und zog den Fokus im selben Tastendruck in den Header. `useMenuTrigger` setzt den Fokus jetzt nur noch auf den Auslöser zurück, wenn er im Band oder nirgendwo (`<body>`) stand. Escape schließt das Band weiterhin in jedem Fall.
