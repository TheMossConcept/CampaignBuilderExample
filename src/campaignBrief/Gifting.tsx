import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import config from '@brandheroes/shared-validation/dist/validation/valueconfig.json';
import { FormHelperText } from '@material-ui/core';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { TextInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftGiftDescriptionQuery,
  CampaignDraftGiftDescriptionQueryVariables,
} from './__generated__/CampaignDraftGiftDescriptionQuery';
import {
  CampaignDraftUpdateGiftDescription,
  CampaignDraftUpdateGiftDescriptionVariables,
} from './__generated__/CampaignDraftUpdateGiftDescription';

type Props = {
  campaignDraftId: string;
  debounceValue?: number;
};

const MUTATION_GIFTING_UDPATE = gql`
  mutation CampaignDraftUpdateGiftDescription($campaignDraftId: ID!, $campaignDraftGiftDescription: String) {
    campaignDraftUpdateGiftDescription(
      campaignDraftId: $campaignDraftId
      giftDescription: $campaignDraftGiftDescription
    ) {
      id
      version
      giftDescription {
        value
      }
    }
  }
`;

const QUERY_GIFTING = gql`
  query CampaignDraftGiftDescriptionQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      giftDescription {
        value
      }
    }
  }
`;

export const CDraftGifting: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [gifting, setGifting] = useState<string | undefined>();

  const { data, loading, error } = useBHQuery<
    CampaignDraftGiftDescriptionQuery,
    CampaignDraftGiftDescriptionQueryVariables
  >(QUERY_GIFTING, {
    variables: { campaignDraftId },
  });

  const initialDescription = getProp(data)
    .on('campaignDraft')
    .onValue('giftDescription')
    .get();

  const [hasBeenInitialized] = useCampaignFieldInitialization(initialDescription, setGifting, loading, error);

  const {
    valueForMutation: giftDescriptionForMutation,
    setValueWithStateUpdates: setGiftDescriptionWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [gifting, setGifting],
    yupValidators.campaignDraft.giftDescription,
    'giftDescription',
    debounceValue,
  );

  const [updateGiftDescriptionMutation] = useBHMutation<
    CampaignDraftUpdateGiftDescription,
    CampaignDraftUpdateGiftDescriptionVariables
  >(MUTATION_GIFTING_UDPATE, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (isDefined(giftDescriptionForMutation)) {
      updateGiftDescriptionMutation({
        variables: { campaignDraftId, campaignDraftGiftDescription: giftDescriptionForMutation },
      });
    }
  }, [campaignDraftId, giftDescriptionForMutation, updateGiftDescriptionMutation]);

  return (
    <>
      <TextInput
        state={[gifting, setGiftDescriptionWithStateUpdates]}
        error={validationError}
        disabled={!hasBeenInitialized}
        fullWidth={true}
        label="Gifting"
      />
      {gifting && (
        <FormHelperText>
          {gifting.length}/{config.campaign.giftDescription.max}
        </FormHelperText>
      )}
    </>
  );
};
