import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import React, { FC } from 'react';

import { useBHQuery } from '../../../apollo/BHApolloProvider';
import { ChipsInput } from '../../common/form/ChipInputs';
import { AllInterestsForPrimaryInterest } from './__generated__/AllInterestsForPrimaryInterest';
import { usePrimaryInterest } from './usePrimaryInterest';

const QUERY_ALL_INTERESTS = gql`
  query AllInterestsForPrimaryInterest {
    interests {
      id
      version
      name
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number };

const CDraftPrimaryInterest: FC<Props> = ({ campaignDraftId, debounceValue = 0 }) => {
  const { data: allInterestsData } = useBHQuery<AllInterestsForPrimaryInterest>(QUERY_ALL_INTERESTS);
  const allInterests = getProp(allInterestsData)
    .on('interests')
    .get();
  const allInterestsChipValues = allInterests
    ? allInterests.map(interest => ({
        label: getProp(interest)
          .on('name')
          .get(),
        value: getProp(interest)
          .on('id')
          .get(),
      }))
    : [];

  const [primaryInterest, setPrimaryInterest] = usePrimaryInterest(campaignDraftId, debounceValue);

  const primaryInterestWrapper = primaryInterest ? [primaryInterest] : [];
  const setPrimaryInterstWrapper = (newValue: string[]) => {
    // Only one primary interest is allowed, so this array should never be longer than 1 element
    if (newValue.length > 1) {
      // If more than one is present, take the last as that will be the new one
      setPrimaryInterest(newValue[newValue.length - 1]);
    } else if (newValue.length === 1) {
      // If there is only one use that
      setPrimaryInterest(newValue[0]);
    } else {
      // If none is selected (happens if we click the same again), reset to nothing
      setPrimaryInterest(null);
    }
  };

  return (
    <ChipsInput state={[primaryInterestWrapper, setPrimaryInterstWrapper]} possibleValues={allInterestsChipValues} />
  );
};

export default CDraftPrimaryInterest;
