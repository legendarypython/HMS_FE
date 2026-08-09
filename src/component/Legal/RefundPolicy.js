import React from 'react';
import AppNavbar from '../Shared/AppNavbar';
import './Legal.css';

// Instamojo-generated Refund and Cancellation Policy, required as part of
// their merchant onboarding checklist. Content used verbatim as generated,
// same reasoning as Terms.js - this is meant to satisfy their compliance
// review, not something to paraphrase.
const RefundPolicy = () => (
  <div>
    <AppNavbar role="public" />
    <div className="page page-narrow">
      <h2 className="section-title">Refund and Cancellation Policy</h2>
      <div className="legal-content">
        <p>
          Upon completing a Transaction, you are entering into a legally binding and enforceable agreement with
          us to purchase the product and/or service. After this point the User may cancel the Transaction unless
          it has been specifically provided for on the Platform, in which case the cancellation will be subject
          to the terms mentioned on the Platform. We shall retain the discretion in approving any cancellation
          requests and we may ask for additional details before approving any requests.
        </p>
        <p>
          Once you have received the product and/or service, the only event where you can request a replacement
          or a return and a refund is if the product and/or service does not match the description as mentioned
          on the Platform. Any request for refund must be submitted within three days from the date of the
          Transaction or such number of days prescribed on the Platform, which shall in no event be less than
          three days.
        </p>
        <p>
          A User may submit a claim for a refund for a purchase made by contacting us on{' '}
          <a href="mailto:seller+89b8a39c4f9f43acaf13afc896fb3814@instamojo.com">
            seller+89b8a39c4f9f43acaf13afc896fb3814@instamojo.com
          </a>{' '}
          and providing a clear and specific reason for the refund request, including the exact terms that have
          been violated, along with any proof, if required. Whether a refund will be provided will be determined
          by us, and we may ask for additional details before approving any requests.
        </p>
      </div>
    </div>
  </div>
);

export default RefundPolicy;
