# Restore the clean ArcTalent background
The user requested removal of the watermarked, laggy Unicorn scene.
Restore the verified non-WebGL application from source 53fdc890dafb483dee7331bff5aceebdf01c3749 in artifacts/arctalent-release-53fdc89.
This retains the CV evidence and workforce persistence fixes, plus the corrected synthetic PDF.
Fresh verification: source tree equality, 32 unit tests and all 14 production API checks passed before this change.
The root Next.js layout uses the original CSS background; no Unicorn embed or dependency is present in this restored application.
Publishing status and public absence of the scene must be checked separately.
