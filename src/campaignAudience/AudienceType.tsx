import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import React, { FC, useCallback, useEffect, useState } from 'react';

import { CampaignAudienceTypeEnum } from '../../../__generated__/types';
import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { SwitchInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftAudienceTypeQuery,
  CampaignDraftAudienceTypeQueryVariables,
} from './__generated__/CampaignDraftAudienceTypeQuery';
import {
  UpdateCampaignDraftAudienceType,
  UpdateCampaignDraftAudienceTypeVariables,
} from './__generated__/UpdateCampaignDraftAudienceType';

const MUTATE_UPDATE_CAMPAIGN_DRAFT_AUDIENCE_TYPE = gql`
  mutation UpdateCampaignDraftAudienceType($campaignDraftId: ID!, $selected: Boolean!) {
    campaignDraftUpdateAudienceType(campaignDraftId: $campaignDraftId, selected: $selected) {
      id
      version
      audienceType {
        value
      }
    }
  }
`;

const QUERY_CAMPAIGN_DRAFT_AUDIENCE_TYPE = gql`
  query CampaignDraftAudienceTypeQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      audienceType {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number };

const CDraftAudienceType: FC<Props> = ({ campaignDraftId, debounceValue = 0 }) => {
  const [audienceType, setAudienceType] = useState<CampaignAudienceTypeEnum | undefined>();

  const { data, loading, error } = useBHQuery<CampaignDraftAudienceTypeQuery, CampaignDraftAudienceTypeQueryVariables>(
    QUERY_CAMPAIGN_DRAFT_AUDIENCE_TYPE,
    {
      variables: { campaignDraftId },
    },
  );
  const initialAudienceType = getProp(data)
    .on('campaignDraft')
    .onValue('audienceType')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(initialAudienceType, setAudienceType, loading, error);

  const {
    valueForMutation: audienceTypeForMutation,
    setValueWithStateUpdates: setAudienceTypeWithStatusUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [audienceType, setAudienceType],
    yupValidators.campaignDraft.audienceType,
    'selected campaign',
    debounceValue,
  );

  const [updateAudienceType] = useBHMutation<UpdateCampaignDraftAudienceType, UpdateCampaignDraftAudienceTypeVariables>(
    MUTATE_UPDATE_CAMPAIGN_DRAFT_AUDIENCE_TYPE,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(audienceTypeForMutation)) {
      updateAudienceType({
        variables: { selected: audienceTypeForMutation === CampaignAudienceTypeEnum.SELECTED, campaignDraftId },
      });
    }
  }, [campaignDraftId, audienceTypeForMutation, updateAudienceType]);

  const isSelected = audienceType === CampaignAudienceTypeEnum.SELECTED;
  const setAudienceTypeThroughToggle = useCallback(
    (newValue: boolean) => {
      if (newValue) {
        setAudienceTypeWithStatusUpdates(CampaignAudienceTypeEnum.SELECTED);
      } else {
        setAudienceTypeWithStatusUpdates(CampaignAudienceTypeEnum.FILTER);
      }
    },
    [setAudienceTypeWithStatusUpdates],
  );

  return (
    <SwitchInput
      state={[isSelected, setAudienceTypeThroughToggle]}
      color="primary"
      error={validationError}
      disabled={!hasBeenInitialized}
      label="Selected campaign"
    />
  );
};

export default CDraftAudienceType;
