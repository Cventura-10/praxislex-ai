-- Add DELETE policy to law_firm_profile table
CREATE POLICY "Users can delete their own law firm profile" 
ON public.law_firm_profile 
FOR DELETE 
USING (auth.uid() = user_id);