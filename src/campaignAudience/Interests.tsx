import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { Chip, Grid, Typography } from '@material-ui/core';
import { isEqual } from 'lodash';
import React, { FC, useCallback, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { ChipsInput } from '../../common/form/ChipInputs';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import { AllInterestsForInterests } from './__generated__/AllInterestsForInterests';
import {
  CampaignDraftInterestsQuery,
  CampaignDraftInterestsQueryVariables,
} from './__generated__/CampaignDraftInterestsQuery';
import {
  CampaignDraftInterestsUpdate,
  CampaignDraftInterestsUpdateVariables,
} from './__generated__/CampaignDraftInterestsUpdate';
import { usePrimaryInterest } from './usePrimaryInterest';

type Props = {
  campaignDraftId: string;
  debounceValue?: number;
  excludeField?: boolean;
};

const MUTATION_INTERESTS_UDPATE = gql`
  mutation CampaignDraftInterestsUpdate($campaignDraftId: ID!, $interests: [ID!]!) {
    campaignDraftUpdateInterests(campaignDraftId: $campaignDraftId, interests: $interests) {
      id
      version
      interests {
        value {
          id
          version
        }
      }
    }
  }
`;

const QUERY_SELECTED_INTERESTS = gql`
  query CampaignDraftInterestsQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      interests {
        value {
          id
          version
        }
      }
    }
  }
`;

const QUERY_ALL_INTERESTS = gql`
  query AllInterestsForInterests {
    interests {
      id
      version
      name
    }
  }
`;

export const CDraftInterests: FC<Props> = ({ campaignDraftId, debounceValue = 0, excludeField = false }) => {
  const mutationName = 'interests';

  const [interests, setInterests] = useState<string[] | undefined>();
  const [primaryInterest, setPrimaryInterest, reinitializePrimaryInterest] = usePrimaryInterest(campaignDraftId);
  const [allInterestsChipIsSelected, setAllInterestsChipIsSelected] = useState(false);

  useEffect(() => {
    reinitializePrimaryInterest();
  }, [excludeField, reinitializePrimaryInterest]);

  const { data: allInterestsData } = useBHQuery<AllInterestsForInterests>(QUERY_ALL_INTERESTS);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const allInterestsIds = allInterests
    ? allInterests.map(interest =>
        getProp(interest)
          .on('id')
          .get(),
      )
    : [];

  const { data, loading, error } = useBHQuery<CampaignDraftInterestsQuery, CampaignDraftInterestsQueryVariables>(
    QUERY_SELECTED_INTERESTS,
    {
      variables: { campaignDraftId },
      skip: excludeField,
    },
  );
  const initialSelectedInterests = getProp(data)
    .on('campaignDraft')
    .onValue('interests')
    .get();
  const initialSelectedInterestsIds = initialSelectedInterests
    ? initialSelectedInterests.map(interest =>
        getProp(interest)
          .on('id')
          .get(),
      )
    : undefined;
  const [hasBeenInitialized] = useCampaignFieldInitialization(
    initialSelectedInterestsIds,
    setInterests,
    loading,
    error,
  );

  // Initialize the layout of the 'all interests' button
  useEffect(() => {
    setAllInterestsChipIsSelected(isEqual(interests, allInterestsIds));
    // NB! This is an array, so ensure this is not called indefinitely
  }, [interests, allInterestsIds]);

  // Initialize the lay
  useEffect(() => {
    if (primaryInterest && interests && !interests.includes(primaryInterest)) {
      setInterests([primaryInterest, ...interests]);
    }
  }, [interests, primaryInterest]);

  const {
    valueForMutation: interestsForMutation,
    setValueWithStateUpdates: setInterestsWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [interests, setInterests],
    yupValidators.campaignDraft.interests,
    mutationName,
    debounceValue,
    {},
    excludeField,
  );

  const [updateInterestsMutation] = useBHMutation<CampaignDraftInterestsUpdate, CampaignDraftInterestsUpdateVariables>(
    MUTATION_INTERESTS_UDPATE,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(interestsForMutation)) {
      updateInterestsMutation({ variables: { campaignDraftId, interests: interestsForMutation } });
    }
  }, [campaignDraftId, interestsForMutation, updateInterestsMutation]);

  const individualInterests = allInterestsChipIsSelected ? [] : interests;
  const setInterestsIndividually = useCallback(
    (newValue: string[]) => {
      setAllInterestsChipIsSelected(false);
      setInterestsWithStateUpdates(newValue);
    },
    [setInterestsWithStateUpdates],
  );

  // Make sure to always update interests when primary interst change
  const setPrimaryInterestWrapper = useCallback(
    (newPrimaryInterst: string) => {
      if (newPrimaryInterst && (interests ? !interests.includes(newPrimaryInterst) : true)) {
        setInterestsWithStateUpdates([...(interests || []), newPrimaryInterst]);
      }

      // If you click on the same primary interst as you have already selected, interpret that as deselect
      setPrimaryInterest(previousValue => (previousValue === newPrimaryInterst ? null : newPrimaryInterst));
    },
    [interests, setInterestsWithStateUpdates, setPrimaryInterest],
  );

  return excludeField ? null : (
    <Grid container={true} spacing={2}>
      <Grid item={true} xs={12}>
        <Chip
          label="All interests"
          color={allInterestsChipIsSelected ? 'primary' : 'default'}
          onClick={() => {
            setAllInterestsChipIsSelected(true);
            setInterestsWithStateUpdates(allInterestsIds);
          }}
        />
      </Grid>
      <Grid item={true} xs={12}>
        <ChipsInput
          disabled={!hasBeenInitialized}
          state={[individualInterests || [], setInterestsIndividually]}
          secondaryState={[primaryInterest, setPrimaryInterestWrapper]}
          possibleValues={allInterestsChipValues}
        />
      </Grid>
      <Grid item={true} xs={12}>
        {validationError && (
          <Typography variant="caption" color="error">
            {validationError}
          </Typography>
        )}
      </Grid>
    </Grid>
  );
};
