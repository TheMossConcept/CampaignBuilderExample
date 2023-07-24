import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { FormGroup, FormHelperText, Grid } from '@material-ui/core';
import React, { FC, useEffect, useState } from 'react';

import { GenderEnums } from '../../../__generated__/types';
import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { CheckboxInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftGendersQuery,
  CampaignDraftGendersQueryVariables,
} from './__generated__/CampaignDraftGendersQuery';
import {
  UpdateCampaignDraftGenders,
  UpdateCampaignDraftGendersVariables,
} from './__generated__/UpdateCampaignDraftGenders';

const MUTATE_UPDATE_GENDERS = gql`
  mutation UpdateCampaignDraftGenders($campaignDraftId: ID!, $genders: [GenderEnums!]!) {
    campaignDraftUpdateGenders(campaignDraftId: $campaignDraftId, genders: $genders) {
      id
      version
      genders {
        value
      }
    }
  }
`;

const QUERY_GENDERS = gql`
  query CampaignDraftGendersQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      genders {
        value
      }
    }
  }
`;

type Props = { campaignDraftId: string; debounceValue?: number; excludeField?: boolean };

const CDraftGenders: FC<Props> = ({ campaignDraftId, debounceValue, excludeField = false }) => {
  const mutationName = 'genders';

  const [genders, setGenders] = useState<GenderEnums[] | undefined>();

  const { data, loading, error } = useBHQuery<CampaignDraftGendersQuery, CampaignDraftGendersQueryVariables>(
    QUERY_GENDERS,
    {
      variables: { campaignDraftId },
      skip: excludeField,
    },
  );
  const initialGenders = getProp(data)
    .on('campaignDraft')
    .onValue('genders')
    .get();
  const [hasBeenInitialized] = useCampaignFieldInitialization(initialGenders, setGenders, loading, error);

  const {
    valueForMutation: gendersForMutation,
    setValueWithStateUpdates: setGendersWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [genders, setGenders],
    yupValidators.campaignDraft.genders,
    mutationName,
    debounceValue,
    {},
    excludeField,
  );

  const [updateGenders] = useBHMutation<UpdateCampaignDraftGenders, UpdateCampaignDraftGendersVariables>(
    MUTATE_UPDATE_GENDERS,
    {
      onCompleted: () => deregisterMutation(true),
      onError: () => deregisterMutation(false),
    },
  );

  useEffect(() => {
    if (isDefined(gendersForMutation)) {
      updateGenders({
        variables: { genders: gendersForMutation, campaignDraftId },
      });
    }
  }, [campaignDraftId, gendersForMutation, updateGenders]);

  const handleCheckboxClicked = (genderClicked: GenderEnums) => (checked: boolean) => {
    setGendersWithStateUpdates(previousValue =>
      checked
        ? [...(previousValue || []), genderClicked]
        : previousValue
        ? previousValue.filter(gender => gender !== genderClicked)
        : [],
    );
  };

  return excludeField ? null : (
    <Grid container={true} spacing={1}>
      <Grid item={true} xs={12}>
        <FormGroup row={true}>
          <CheckboxInput
            state={[genders ? genders.includes(GenderEnums.FEMALE) : false, handleCheckboxClicked(GenderEnums.FEMALE)]}
            color="primary"
            label="Female"
            disabled={!hasBeenInitialized}
          />
          <CheckboxInput
            state={[genders ? genders.includes(GenderEnums.MALE) : false, handleCheckboxClicked(GenderEnums.MALE)]}
            color="primary"
            label="Male"
            disabled={!hasBeenInitialized}
          />
        </FormGroup>
      </Grid>
      <Grid>{validationError && <FormHelperText error={true}>{validationError}</FormHelperText>}</Grid>
    </Grid>
  );
};

export default CDraftGenders;
