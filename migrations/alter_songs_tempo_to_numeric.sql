-- Change tempo column from integer to numeric to support decimal values (e.g. 68.5 bpm)
ALTER TABLE songs ALTER COLUMN tempo TYPE numeric USING tempo::numeric;
