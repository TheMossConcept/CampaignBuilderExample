import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { validAdvertDisclaimers } from '@brandheroes/shared-validation/dist/validation/yupValidators/sharedValidators';
import { FormLabel, Grid } from '@material-ui/core';
import { uniq } from 'lodash';
import React, { FC, useEffect, useState } from 'react';

import { useBHMutation, useBHQuery } from '../../../apollo/BHApolloProvider';
import { SelectInput } from '../../common/form/SimpleFormFields';
import { useCampaignFieldInitialization, useCampaignFieldState } from '../CampaignBuilderFormFieldsState';
import {
  CampaignDraftCaptionSpecificsQuery,
  CampaignDraftCaptionSpecificsQueryVariables,
} from './__generated__/CampaignDraftCaptionSpecificsQuery';
import {
  CampaignDraftUpdateCaptionSpecifics,
  CampaignDraftUpdateCaptionSpecificsVariables,
} from './__generated__/CampaignDraftUpdateCaptionSpecifics';

type Props = {
  campaignDraftId: string;
  debounceValue?: number;
};

const MUTATION_CAPTION_SPECIFICS_UDPATE = gql`
  mutation CampaignDraftUpdateCaptionSpecifics($campaignDraftId: ID!, $campaignDraftCaptionSpecifics: String) {
    campaignDraftUpdateCaptionSpecifics(
      campaignDraftId: $campaignDraftId
      captionSpecifics: $campaignDraftCaptionSpecifics
    ) {
      id
      version
      captionSpecifics {
        value
      }
    }
  }
`;

const QUERY_CAPTION_SPECIFICS = gql`
  query CampaignDraftCaptionSpecificsQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      captionSpecifics {
        value
      }
    }
  }
`;

export const CDraftCaptionSpecifics: FC<Props> = ({ campaignDraftId, debounceValue }) => {
  const [captionSpecifics, setCaptionSpecifics] = useState<string | undefined>();

  const { data, loading, error } = useBHQuery<
    CampaignDraftCaptionSpecificsQuery,
    CampaignDraftCaptionSpecificsQueryVariables
  >(QUERY_CAPTION_SPECIFICS, {
    variables: { campaignDraftId },
  });
  const initialCaptionSpecifics = getProp(data)
    .on('campaignDraft')
    .onValue('captionSpecifics')
    .get();

  useCampaignFieldInitialization(initialCaptionSpecifics, setCaptionSpecifics, loading, error);

  const {
    valueForMutation: captionSpecificsForMutation,
    setValueWithStateUpdates: setCaptionSpecificsWithStateUpdates,
    validationError,
    deregisterMutation,
  } = useCampaignFieldState(
    [captionSpecifics, setCaptionSpecifics],
    yupValidators.campaignDraft.captionSpecifics,
    'caption specifics',
    debounceValue,
  );

  const [updateDescriptionMutation] = useBHMutation<
    CampaignDraftUpdateCaptionSpecifics,
    CampaignDraftUpdateCaptionSpecificsVariables
  >(MUTATION_CAPTION_SPECIFICS_UDPATE, {
    onCompleted: () => deregisterMutation(true),
    onError: () => deregisterMutation(false),
  });

  useEffect(() => {
    if (isDefined(captionSpecificsForMutation)) {
      updateDescriptionMutation({
        variables: { campaignDraftId, campaignDraftCaptionSpecifics: captionSpecificsForMutation },
      });
    }
  }, [campaignDraftId, captionSpecificsForMutation, updateDescriptionMutation]);

  const options = uniq(Object.values(validAdvertDisclaimers).flat());

  const newOptions = options.map(disclaimer => {
    // Get all countries that contain this disclaimer
    const countries = Object.entries(validAdvertDisclaimers).reduce<string[]>((accumulator, [country, disclaimers]) => {
      const countryWithoutCountryCode = country.lastIndexOf(' ')
        ? country.substring(0, country.lastIndexOf(' '))
        : country;

      return disclaimers.includes(disclaimer) && countryWithoutCountryCode
        ? [...accumulator, countryWithoutCountryCode]
        : accumulator;
    }, []);

    return { disclaimer, countries };
  });

  return (
    <Grid container={true}>
      <Grid item={true} xs={12}>
        <FormLabel>Disclaimer</FormLabel>
      </Grid>
      <Grid item={true} xs={3}>
        <SelectInput
          state={[captionSpecifics, setCaptionSpecificsWithStateUpdates]}
          possibleValues={newOptions.map(option => ({
            label: `${option.disclaimer} // ${option.countries.join(', ')}`,
            value: option.disclaimer,
          }))}
          error={validationError}
          fullWidth={true}
        />
      </Grid>
    </Grid>
  );
};
