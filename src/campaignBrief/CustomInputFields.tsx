import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import config from '@brandheroes/shared-validation/dist/validation/valueconfig.json';
import React, { FC, useEffect, useState } from 'react';

import { CampaignCustomInputFieldInputType } from '../../../__generated__/types';
import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import LabelValueInput from '../../common/form/LabelValueInput';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftCustomInputFieldsQuery,
  CampaignDraftCustomInputFieldsQueryVariables,
} from './__generated__/CampaignDraftCustomInputFieldsQuery';
import {
  CampaignDraftUpdateCustomInputFields,
  CampaignDraftUpdateCustomInputFieldsVariables,
} from './__generated__/CampaignDraftUpdateCustomInputFields';

type Props = {
  campaignDraftId: string;
  debounceValue?: number;
};

const MUTATION_CUSTOM_INPUT_FIELD_UDPATE = gql`
  mutation CampaignDraftUpdateCustomInputFields(
    $campaignDraftId: ID!
    $campaignDraftCustomInputFields: [CampaignCustomInputFieldInputType!]!
  ) {
    campaignDraftUpdateCustomInputFields(
      campaignDraftId: $campaignDraftId
      customInputFields: $campaignDraftCustomInputFields
    ) {
      id
      version
      customInputFields {
        value {
          id
          label
          value
        }
      }
    }
  }
`;

const QUERY_CUSTOM_INPUT_FIELDS = gql`
  query CampaignDraftCustomInputFieldsQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      customInputFields {
        value {
          id
          label
          value
        }
      }
    }
  }
`;

export const CDraftCustomInputFields: FC<Props> = ({ campaignDraftId, debounceValue = 0 }) => {
  const [customInputFields, setCustomInputFields] = useState<CampaignCustomInputFieldInputType[] | undefined>(
    undefined,
  );

  const { data, loading, error } = useBHQuery<
    CampaignDraftCustomInputFieldsQuery,
    CampaignDraftCustomInputFieldsQueryVariables
  >(QUERY_CUSTOM_INPUT_FIELDS, {
    variables: { campaignDraftId },
  });
  const initialCustomInputFields =
    getProp(data)
      .on('campaignDraft')
      .onValue('customInputFields')
      .get() || [];

  useCampaignFieldInitialization(initialCustomInputFields, setCustomInputFields, loading, error);

  const {
    valueForMutation: customInputFieldsForMutation,
    setValueWithStateUpdates: setCustomInputFieldsWithStateUpdates,
    deregisterMutation,
  } = useCampaignFieldState(
    [customInputFields, setCustomInputFields],
    yupValidators.campaignDraft.customInputFields,
    'custom input fields',
    debounceValue,
  );

  const [updateCustomInputFields, { loading: mutationLoading }] = useBHMutation<
    CampaignDraftUpdateCustomInputFields,
    CampaignDraftUpdateCustomInputFieldsVariables
  >(MUTATION_CUSTOM_INPUT_FIELD_UDPATE, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (customInputFieldsForMutation) {
      updateCustomInputFields({
        variables: { campaignDraftId, campaignDraftCustomInputFields: customInputFieldsForMutation },
      });
    }
  }, [campaignDraftId, customInputFieldsForMutation, updateCustomInputFields]);

  return (
    <LabelValueInput
      state={[customInputFields, setCustomInputFieldsWithStateUpdates]}
      title="Custom input fields"
      loading={mutationLoading}
      labelMax={config.customInputField.label.max}
      valueMax={config.customInputField.value.max}
      validator={yupValidators.campaignDraft.customInputFields}
    />
  );
};
