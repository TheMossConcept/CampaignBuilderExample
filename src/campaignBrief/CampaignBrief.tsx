import { Button, Grid, makeStyles, Typography } from '@material-ui/core';
import React, { FC, useState } from 'react';

import ManageCampaignProductLinksDialog from '../../product-links/dialogs/ManageCampaignProductLinksDialog';
import { CDraftCaptionSpecifics } from './CaptionSpecifics';
import { CDraftContentSpecifics } from './ContentSpecifics';
import CDraftCustomCompanyLogo from './CustomCompanyLogo';
import { CDraftCustomInputFields } from './CustomInputFields';
import { CDraftDefaultAccountTags } from './DefaultAccountTags';
import { CDraftDefaultCaption } from './DefaultCaption';
import { CDraftDefaultHashtags } from './DefaultHashtags';
import { CDraftDescription } from './Description';
import { CDraftGifting } from './Gifting';
import CDraftInspirationMedia from './InspirationMedia';
import MobilePhoneCampaignPreview from './MobilePhoneCampaignPreview';
import { CDraftPostEndDate } from './PostEndDate';
import { CDraftPostStartDate } from './PostStartDate';
import ManageRatingsAndMultipleChoiceQuestionsDialog from './questionnaire/ManageRatingsAndMultipleChoiceQuestionsDialog';
import { CDraftSubtitle } from './Subtitle';
import { CDraftTitle } from './Title';
import { ManageWeblinksDialog } from './weblinks/ManageWeblinksDialog';

type Props = {
  campaignId: string;
  campaignDraftId: string;
  containerClass?: string;
};

const useStyles = makeStyles(() => ({
  miniHeaders: {
    fontStyle: 'bold',
    marginTop: '20px',
  },
}));

const CampaignBrief: FC<Props> = ({ campaignId, campaignDraftId, containerClass }) => {
  const [weblinksDialogIsOpen, setWeblinksDialogIsOpen] = useState(false);
  const [productLinksDialogIsOpen, setProductLinksDialogIsOpen] = useState(false);
  const [ratingsAndQuestionsDialogIsOpen, setRatingsAndQuestionsDialogIsOpen] = useState(false);

  const { miniHeaders } = useStyles();

  return (
    <Grid container={true} spacing={4} className={containerClass}>
      <Grid item={true} xs={true}>
        <Grid container={true} spacing={2}>
          <Grid item={true} xs={12}>
            <Typography variant="h4">Create influencer brief</Typography>
          </Grid>
          <Grid item={true} xs={12}>
            <CDraftTitle campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true} xs={12}>
            <CDraftSubtitle campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true} sm={6} xs={12}></Grid>
          <Grid item={true} xs={12}>
            <CDraftDescription campaignDraftId={campaignDraftId} />
          </Grid>

          <Grid item={true} xs={12}>
            <Typography variant="h6" className={miniHeaders}>
              DEAL
            </Typography>
          </Grid>
          <Grid item={true} xs={12}>
            <CDraftGifting campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true} xs={12}>
            <CDraftContentSpecifics campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true} sm={6} xs={12}>
            <CDraftPostStartDate campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true} sm={6} xs={12}>
            <CDraftPostEndDate campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true} xs={12}>
            <CDraftCustomInputFields campaignDraftId={campaignDraftId} />
          </Grid>

          <Grid item={true} xs={12}>
            <Typography variant="h6" className={miniHeaders}>
              CAPTION
            </Typography>
          </Grid>
          <Grid item={true} xs={12}>
            <CDraftCaptionSpecifics campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true} xs={12}>
            <CDraftDefaultHashtags campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true} xs={12}>
            <CDraftDefaultAccountTags campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true} xs={12}>
            <CDraftDefaultCaption campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true} xs={12}>
            <CDraftInspirationMedia campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true} xs={12}>
            <CDraftCustomCompanyLogo campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true} xs={12}>
            <Grid container={true} spacing={2}>
              <Grid item={true}>
                <Button variant="contained" color="primary" onClick={() => setWeblinksDialogIsOpen(true)}>
                  Manage weblinks
                </Button>
                <ManageWeblinksDialog
                  dialogOpen={weblinksDialogIsOpen}
                  closeDialog={() => setWeblinksDialogIsOpen(false)}
                  campaignDraftId={campaignDraftId}
                  campaignId={campaignId}
                />
              </Grid>
              <Grid item={true}>
                <Button variant="contained" color="primary" onClick={() => setProductLinksDialogIsOpen(true)}>
                  Manage product links
                </Button>
                <ManageCampaignProductLinksDialog
                  tempData={{ __typename: 'Campaign', id: campaignId }}
                  open={productLinksDialogIsOpen}
                  onClose={() => setProductLinksDialogIsOpen(false)}
                />
              </Grid>
              <Grid item={true}>
                <Button variant="contained" color="primary" onClick={() => setRatingsAndQuestionsDialogIsOpen(true)}>
                  Manage rating and questions
                </Button>
                <ManageRatingsAndMultipleChoiceQuestionsDialog
                  campaignDraftId={campaignDraftId}
                  open={ratingsAndQuestionsDialogIsOpen}
                  closeDialog={() => setRatingsAndQuestionsDialogIsOpen(false)}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid item={true}>
        <MobilePhoneCampaignPreview campaignDraftId={campaignDraftId} />
      </Grid>
    </Grid>
  );
};

export default CampaignBrief;
