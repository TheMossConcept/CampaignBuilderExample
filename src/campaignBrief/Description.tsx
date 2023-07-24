import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { TextInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftDescriptionQuery,
  CampaignDraftDescriptionQueryVariables,
} from './__generated__/CampaignDraftDescriptionQuery';
import {
  CampaignDraftDescriptionUpdate,
  CampaignDraftDescriptionUpdateVariables,
} from './__generated__/CampaignDraftDescriptionUpdate';

type Props = {
  campaignDraftId: string;
  debounceValue?: number;
};

const MUTATION_DESCRIPTION_UDPATE = gql`
  mutation CampaignDraftDescriptionUpdate($campaignDraftId: ID!, $campaignDraftDescription: String) {
    campaignDraftUpdateDescription(campaignDraftId: $campaignDraftId, description: $campaignDraftDescription) {
      id
      version
      description {
        value
      }
    }
  }
`;

const QUERY_DESCRIPTION = gql`
  query CampaignDraftDescriptionQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      description {
        value
      }
    }
  }
`;

export const CDraftDescription: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [description, setDescription] = useState<string | undefined>();

  const { data, loading, error } = useBHQuery<CampaignDraftDescriptionQuery, CampaignDraftDescriptionQueryVariables>(
    QUERY_DESCRIPTION,
    {
      variables: { campaignDraftId },
    },
  );
  const initialDescription = getProp(data)
    .on('campaignDraft')
    .onValue('description')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(initialDescription, setDescription, loading, error);

  const {
    valueForMutation: descriptionForMutation,
    setValueWithStateUpdates: setDescriptionWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [description, setDescription],
    yupValidators.campaignDraft.description,
    'description',
    debounceValue,
  );

  const [updateDescriptionMutation] = useBHMutation<
    CampaignDraftDescriptionUpdate,
    CampaignDraftDescriptionUpdateVariables
  >(MUTATION_DESCRIPTION_UDPATE, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (isDefined(descriptionForMutation)) {
      updateDescriptionMutation({
        variables: { campaignDraftId, campaignDraftDescription: descriptionForMutation },
      });
    }
  }, [campaignDraftId, descriptionForMutation, updateDescriptionMutation]);

  return (
    <TextInput
      state={[description, setDescriptionWithStateUpdates]}
      error={validationError}
      disabled={!hasBeenInitialized}
      fullWidth={true}
      label="Short campaign description"
    />
  );
};
