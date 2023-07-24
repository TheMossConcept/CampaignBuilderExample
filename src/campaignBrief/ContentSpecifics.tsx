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
  CampaignDraftContentSpecificsQuery,
  CampaignDraftContentSpecificsQueryVariables,
} from './__generated__/CampaignDraftContentSpecificsQuery';
import {
  CampaignDraftUpdateContentSpecifics,
  CampaignDraftUpdateContentSpecificsVariables,
} from './__generated__/CampaignDraftUpdateContentSpecifics';

type Props = {
  campaignDraftId: string;
  debounceValue?: number;
};

const MUTATION_CONTENT_SPECIFICS_UDPATE = gql`
  mutation CampaignDraftUpdateContentSpecifics($campaignDraftId: ID!, $campaignDraftContentSpecifics: String) {
    campaignDraftUpdateContentSpecifics(
      campaignDraftId: $campaignDraftId
      contentSpecifics: $campaignDraftContentSpecifics
    ) {
      id
      version
      contentSpecifics {
        value
      }
    }
  }
`;

const QUERY_CONTENT_SPECIFICS = gql`
  query CampaignDraftContentSpecificsQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      contentSpecifics {
        value
      }
    }
  }
`;

export const CDraftContentSpecifics: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [contentSpecifics, setContentSpecifics] = useState<string | undefined>();

  const { data, loading, error } = useBHQuery<
    CampaignDraftContentSpecificsQuery,
    CampaignDraftContentSpecificsQueryVariables
  >(QUERY_CONTENT_SPECIFICS, {
    variables: { campaignDraftId },
  });
  const initialDescription = getProp(data)
    .on('campaignDraft')
    .onValue('contentSpecifics')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(initialDescription, setContentSpecifics, loading, error);

  const {
    valueForMutation: contentSpecificsForMutation,
    setValueWithStateUpdates: setDescriptionWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [contentSpecifics, setContentSpecifics],
    yupValidators.campaignDraft.contentSpecifics,
    'content specifics',
    debounceValue,
  );

  const [updateContentSpecificsMutation] = useBHMutation<
    CampaignDraftUpdateContentSpecifics,
    CampaignDraftUpdateContentSpecificsVariables
  >(MUTATION_CONTENT_SPECIFICS_UDPATE, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (isDefined(contentSpecificsForMutation)) {
      updateContentSpecificsMutation({
        variables: { campaignDraftId, campaignDraftContentSpecifics: contentSpecificsForMutation },
      });
    }
  }, [campaignDraftId, contentSpecificsForMutation, updateContentSpecificsMutation]);

  return (
    <>
      <TextInput
        state={[contentSpecifics, setDescriptionWithStateUpdates]}
        error={validationError}
        disabled={!hasBeenInitialized}
        fullWidth={true}
        label="Content Specifics"
      />
      {contentSpecifics && (
        <FormHelperText>
          {contentSpecifics.length}/{config.campaign.contentSpecifics.max}
        </FormHelperText>
      )}
    </>
  );
};
