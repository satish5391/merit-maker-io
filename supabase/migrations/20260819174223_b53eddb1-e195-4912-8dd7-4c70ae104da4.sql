
CREATE TABLE public.tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text NOT NULL DEFAULT 'General',
  duration_minutes integer NOT NULL DEFAULT 10,
  positive_marks numeric NOT NULL DEFAULT 1,
  negative_marks numeric NOT NULL DEFAULT 0.25,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tests TO anon, authenticated;
GRANT ALL ON public.tests TO service_role;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tests public access" ON public.tests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 1,
  body text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO anon, authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions public access" ON public.questions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  student_name text NOT NULL DEFAULT 'Guest',
  score numeric NOT NULL DEFAULT 0,
  max_score numeric NOT NULL DEFAULT 0,
  correct_count integer NOT NULL DEFAULT 0,
  wrong_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  accuracy numeric NOT NULL DEFAULT 0,
  time_taken_seconds integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.attempts TO anon, authenticated;
GRANT ALL ON public.attempts TO service_role;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts readable" ON public.attempts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "attempts insertable" ON public.attempts FOR INSERT TO anon, authenticated WITH CHECK (true);

INSERT INTO public.tests (id, title, subject, duration_minutes, positive_marks, negative_marks) VALUES
('11111111-1111-1111-1111-111111111111', 'Quantitative Aptitude Mock Test 1', 'Quant', 10, 2, 0.5);

INSERT INTO public.questions (test_id, position, body, options, correct_index) VALUES
('11111111-1111-1111-1111-111111111111', 1, 'What is 15% of 240?', '["24","36","40","32"]'::jsonb, 1),
('11111111-1111-1111-1111-111111111111', 2, 'A train 120 m long runs at 60 km/h. Time to cross a pole?', '["7.2 s","6.0 s","8.4 s","5.0 s"]'::jsonb, 0),
('11111111-1111-1111-1111-111111111111', 3, 'If x + 1/x = 3, then x^2 + 1/x^2 = ?', '["6","7","9","11"]'::jsonb, 1),
('11111111-1111-1111-1111-111111111111', 4, 'Average of first 10 natural numbers is:', '["5","5.5","6","4.5"]'::jsonb, 1),
('11111111-1111-1111-1111-111111111111', 5, 'Simple interest on 5000 at 8% for 2 years is:', '["700","750","800","850"]'::jsonb, 2);

INSERT INTO public.attempts (test_id, student_name, score, max_score, correct_count, wrong_count, skipped_count, accuracy, time_taken_seconds) VALUES
('11111111-1111-1111-1111-111111111111', 'Aarav', 8, 10, 4, 1, 0, 80, 420),
('11111111-1111-1111-1111-111111111111', 'Diya', 6, 10, 3, 0, 2, 100, 500),
('11111111-1111-1111-1111-111111111111', 'Rohan', 4.5, 10, 3, 3, -1, 50, 600),
('11111111-1111-1111-1111-111111111111', 'Meera', 10, 10, 5, 0, 0, 100, 380),
('11111111-1111-1111-1111-111111111111', 'Kabir', 2, 10, 2, 4, 0, 33.3, 560);
