import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { yupValidators } from '@brandheroes/shared-validation';
import { Button, Card, Grid, makeStyles } from '@material-ui/core';
import React, { FC, KeyboardEvent, useCallback, useState } from 'react';

import { useBHMutation } from '../../../apollo/BHApolloProvider';
import { useInputValidation } from '../../../hooks/validation';
import { TextInput } from '../../common/form/SimpleFormFields';
import Loading from '../../common/Loading';
import { CreateNewCampaign, CreateNewCampaignVariables } from './__generated__/CreateNewCampaign';

const MUTATION_CAMPAIGN_CREATE = gql`
  mutation CreateNewCampaign($name: String!, $companyId: ID!) {
    campaignCreate(name: $name, companyId: $companyId, visibleBeforeStartDate: false, emailsToNotify: []) {
      id
      version
      name {
        value
      }
      draftMeta {
        value {
          id
          version
          draft {
            value {
              id
              version
            }
          }
        }
      }
    }
  }
`;

type Props = {
  onCompletion: (campaignId: string, campaignDraftId: string) => void;
  companyId: string;
};

const useStyles = makeStyles({
  card: {
    padding: '12px',
  },
});

export const CreateCampaignWithName: FC<Props> = ({ onCompletion, companyId }) => {
  const [campaignName, setCampaignName] = useState<string>('');

  const [createCampaignMutation, { loading }] = useBHMutation<CreateNewCampaign, CreateNewCampaignVariables>(
    MUTATION_CAMPAIGN_CREATE,
    {
      onCompleted: data => {
        const campaignId = getProp(data)
          .on('campaignCreate')
          .on('id')
          .get();
        const campaignDraftId = getProp(data)
          .on('campaignCreate')
          .onValue('draftMeta')
          .onValue('draft')
          .on('id')
          .get();

        if (campaignDraftId) {
          onCompletion(campaignId, campaignDraftId);
        }
      },
    },
  );

  const {
    validationError,
    setValueWithValidation: setCampaignNameWithValidation,
    didPassValidation,
  } = useInputValidation([campaignName, setCampaignName], yupValidators.campaign.name);

  const saveButtonDisabled = !didPassValidation || loading;

  const onKeyPress = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter' && isDefined(companyId)) {
        createCampaignMutation({ variables: { name: campaignName, companyId } });
      }
    },
    [campaignName, companyId, createCampaignMutation],
  );

  const { card } = useStyles();
  return (
    <Grid item={true} xs={12}>
      <Card className={card}>
        <Grid container={true} alignItems="center" spacing={1}>
          <Grid item={true} xs={true}>
            <TextInput
              state={[campaignName, setCampaignNameWithValidation]}
              error={validationError}
              onKeyPress={onKeyPress}
              fullWidth={true}
              multiline={false}
              label="Campaign name"
            />
          </Grid>
          <Grid item={true}>
            <Button
              disabled={saveButtonDisabled}
              variant="contained"
              color={saveButtonDisabled ? 'default' : 'primary'}
              onClick={() => {
                createCampaignMutation({ variables: { name: campaignName, companyId } });
              }}
            >
              {loading && <Loading variant="button" />}
              Create
            </Button>
          </Grid>
        </Grid>
      </Card>
    </Grid>
  );
};
