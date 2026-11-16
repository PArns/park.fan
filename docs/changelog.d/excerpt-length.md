### Der Auszug eines Beitrags hat eine Höchstlänge

`check:prose` warnt mit der neuen Regel `excerpt-length` (§5.4), wenn der Auszug länger als zwei
Sätze oder 200 Zeichen ist, im Französischen, Spanischen und Italienischen 220. Der Auszug steht
als Lead unter der Überschrift, auf den Karten werden davon nur zwei Zeilen gezeigt. Die deutschen
Auszüge lagen im Mittel bei 257 Zeichen, der des Wintertraum-Guides bei 334 in vier Sätzen. Die
Regel gilt für Beiträge mit `date` oder `updatedAt` ab dem 16. November 2026, ältere behalten ihren
Auszug bis zur nächsten Überarbeitung. Fünf Testfälle in `pnpm test:prose-rules`.
