### Der Footer verlinkt GitHub nicht mehr

`components/layout/footer.tsx` zeigt in der Markenspalte nur noch das Entwicklerportal. Der Link auf
das GitHub-Profil ist weg, mit ihm der Trennpunkt und die Container-Query, die die beiden Links bei
schmaler Spalte untereinander stellte. Ein einzelner Link braucht keine Liste, darum fällt auch
`footer.sections.resources` als `aria-label` in allen sechs Sprachen weg.
