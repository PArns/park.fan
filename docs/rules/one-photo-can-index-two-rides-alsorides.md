# One photo can index two rides (`alsoRides`) (REQUIREMENT)

Where the park built one structure that the API lists as two attractions (Winja's Fear and Force,
YOY Chill and Thrill), the photo is stored **once**, with the second slug in the sidecar's
`alsoRides`, never as a second copy of the file. Every slug is validated against the park's
attractions, so a typo is a build warning rather than a blank ride page. It is not a licence to
reuse: the photo must be a fair card for every slug named.

## Why

These photos used to be two byte-identical files, and when the media migration removed the
duplicate, the second ride silently lost its only picture: nothing re-checks whether a ride still
has one.

The sidecar field and where it is matched: [public/media/README.md → one photo, two
rides](../../public/media/README.md#one-photo-two-rides-alsorides).
