-- Store the raw bolt11 (Lightning payment request) so it can be re-served
-- after the create response, e.g. when the student refreshes the pay page.
ALTER TABLE payments ADD COLUMN payment_request text;