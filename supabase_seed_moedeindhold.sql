-- ============================================================
-- VALGFRIT — forudfylder "Regler & filosofi" og "Referater" med
-- indholdet fra jeres seneste trænermøde.
--
-- Kør KUN denne fil EFTER migration_6.sql er kørt.
-- Erstat 'din-email@example.dk' begge steder nedenfor med din egen
-- login-mail, før du kører scriptet.
-- ============================================================

insert into club_rules (title, category, body, created_by) values
('Fælles ramme til træning', 'Træning', 'Vi bruger Better Coaching-appen som fælles ramme, opdelt i 4 stationer. Maks. 10 spillere pr. gruppe og maks. 4 grupper ad gangen. Er der over 40 spillere til stede, fordeles de ud på grupperne.', (select id from auth.users where email = 'din-email@example.dk')),
('Vagtplan og tilmelding', 'Træning', 'Trænere melder sig på vagtplanen forud for hver træning. Tilmelding og afmelding til kampe sker via Kampklar.', (select id from auth.users where email = 'din-email@example.dk')),
('Trænernes forpligtelser', 'Trænere', 'Alle trænere møder til minimum én fast træningsdag om ugen, følger de aftaler der indgås på trænermøderne, og accepterer kompromiser og bakker fælles beslutninger op. Kan man ikke stå inde for den fælles retning, må man finde et andet sted.', (select id from auth.users where email = 'din-email@example.dk')),
('Stævner: Kris-metoden', 'Stævner & hold', 'Alle tilmeldte spillere skal ud og spille. Holdsammensætning sker dynamisk ud fra antal tilmeldte på dagen — fx dannes 4 hold ved 30 spillere, fordelt så de matcher de niveauer der er til stede. Der er ikke faste hold.', (select id from auth.users where email = 'din-email@example.dk')),
('Truppemøder og rotation', 'Stævner & hold', 'Vi kører 4 truppemøder om året, som giver naturlig rotation uden ugentlige omvæltninger.', (select id from auth.users where email = 'din-email@example.dk')),
('Faste mødedatoer', 'Møder', 'Trænermøder holdes sidste tirsdag inden sommer-, efterårs-, jul- og påskeferie. Årgangsmøde holdes sidste torsdag inden sommerferie og jul. Møderne bruges til at evaluere opdeling, stævnehold, træningsstruktur og trænercommitment.', (select id from auth.users where email = 'din-email@example.dk')),
('Vi er én trænergruppe', 'Kultur', 'Vi er ikke A-, B- og C-trænere — vi er én trænergruppe. Vi tør sige vores mening bredt, ikke i krogene, og vi står sammen om de beslutninger der bliver truffet.', (select id from auth.users where email = 'din-email@example.dk'));

insert into referater (title, body, created_by, created_by_name) values
('Trænermøde: Fælles retning for årgangen', 'Baggrund
Målet med mødet var at skabe fælles struktur og aftaler på tværs af trænerne. Vi siger ofte noget, uden at gøre det samme i praksis — ikke af ond vilje, men fordi vi manglede en fælles ramme. Målet er samme adfærd i hverdagen, ikke nødvendigvis fuld enighed.

Træning
Vi bruger Better Coaching-appen med 4 stationer, maks. 10 spillere pr. gruppe og maks. 4 grupper ad gangen. Er der over 40 spillere til stede, fordeles de ud. Flere trænere ønskede mere holdtræning og taktik — det tages med i den videre tilrettelæggelse. Trænere melder sig på en vagtplan forud for hver træning. Tilmelding/afmelding til kampe sker via Kampklar.

Trænere
Alle trænere forpligter sig til at møde mindst én fast træningsdag om ugen, følge de aftaler der indgås, og bakke op om fælles beslutninger. Søren Vase og Søren Egestrand er kommet til som nye trænere. Morten er stoppet som træner.

Stævner og holdsammensætning
Vi kører Kris-metoden: alle tilmeldte spillere skal ud og spille. Holdsammensætning sker dynamisk ud fra antal tilmeldte på dagen. Der er ikke faste hold. Vi fortsætter med 4 truppemøder om året.

Faste datoer
Trænermøder: sidste tirsdag inden sommer-, efterårs-, jul- og påskeferie.
Årgangsmøde: sidste torsdag inden sommerferie og jul.

Vi er én trænergruppe
Vi tør sige vores mening bredt, ikke i krogene. Vi er ikke A-, B- og C-trænere — vi er én trænergruppe.

Næste møde: tirsdag d. 4. august (Søren Vase og Søren Egestrand deltager også). På dagsordenen: faste mødedatoer og planlægning af forældreinfodag.', (select id from auth.users where email = 'din-email@example.dk'), 'Kenneth');
