import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { TextInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftSubtitleQuery,
  CampaignDraftSubtitleQueryVariables,
} from './__generated__/CampaignDraftSubtitleQuery';
import {
  CampaignDraftSubtitleUpdate,
  CampaignDraftSubtitleUpdateVariables,
} from './__generated__/CampaignDraftSubtitleUpdate';

type Props = {
  campaignDraftId: string;
  debounceValue?: number;
};

const MUTATION_SUBTITLE_UDPATE = gql`
  mutation CampaignDraftSubtitleUpdate($campaignDraftId: ID!, $campaignDraftSubtitle: String!) {
    campaignDraftUpdateSubtitle(campaignDraftId: $campaignDraftId, subtitle: $campaignDraftSubtitle) {
      id
      version
      subtitle {
        value
      }
    }
  }
`;

const QUERY_SUBTITLE = gql`
  query CampaignDraftSubtitleQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      subtitle {
        value
      }
    }
  }
`;

export const CDraftSubtitle: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [subtitle, setSubtitle] = useState<string | undefined>();

  const { data, loading, error } = useBHQuery<CampaignDraftSubtitleQuery, CampaignDraftSubtitleQueryVariables>(
    QUERY_SUBTITLE,
    {
      variables: { campaignDraftId },
    },
  );
  const initialSubtitle = getProp(data)
    .on('campaignDraft')
    .onValue('subtitle')
    .get();

  const [hasBeenInitialized] = useCampaignFieldInitialization(initialSubtitle, setSubtitle, loading, error);
  const {
    valueForMutation: subtitleForMutation,
    setValueWithStateUpdates: setSubtitleWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState([subtitle, setSubtitle], yupValidators.campaignDraft.subtitle, 'subtitle', debounceValue);

  const [updateSubtitleMutation] = useBHMutation<CampaignDraftSubtitleUpdate, CampaignDraftSubtitleUpdateVariables>(
    MUTATION_SUBTITLE_UDPATE,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(subtitleForMutation)) {
      updateSubtitleMutation({ variables: { campaignDraftId, campaignDraftSubtitle: subtitleForMutation } });
    }
  }, [campaignDraftId, subtitleForMutation, updateSubtitleMutation]);

  return (
    <TextInput
      state={[subtitle, setSubtitleWithStateUpdates]}
      error={validationError}
      disabled={!hasBeenInitialized}
      fullWidth={true}
      label="Subtitle"
    />
  );
};
