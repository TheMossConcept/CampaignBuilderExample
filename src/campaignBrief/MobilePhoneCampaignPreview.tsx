import { gql } from '@apollo/client';
import { getProp, isDefined } from '@brandheroes/brandheroes-shared-project';
import { Divider, Grid, makeStyles, Theme, Typography } from '@material-ui/core';
import IosBack from '@material-ui/icons/ArrowBackIosRounded';
import Battery from '@material-ui/icons/Battery90Sharp';
import Bluetooth from '@material-ui/icons/BluetoothSharp';
import Upload from '@material-ui/icons/CloudUploadSharp';
import Signal from '@material-ui/icons/SignalCellular4BarSharp';
import classNames from 'classnames';
import { DateTime } from 'luxon';
import React, { FC } from 'react';

import { useBHQuery } from '../../../apollo/BHApolloProvider';
import BHSpacer from '../../common/BHSpacer';
import Loading from '../../common/Loading';
import ImageWithAvatar from '../../common/media/image/ImageWithAvatar';
import {
  QueryMobilePhoneCampaignPreviewData,
  QueryMobilePhoneCampaignPreviewDataVariables,
} from './__generated__/QueryMobilePhoneCampaignPreviewData';
import { SelectedCompanyDataForCampaignPreview } from './__generated__/SelectedCompanyDataForCampaignPreview';
import { PostMediaType } from '../../../__generated__/types';

const QUERY_MOBILE_PHONE_CAMPAIGN_PREVIEW_DATA = gql`
  query QueryMobilePhoneCampaignPreviewData($campaignDraftId: ID!, $companyId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      inspirationImages {
        value {
          id
        }
      }
      coverImage {
        value {
          id
        }
      }
      companyLogo {
        value {
          id
        }
      }
      title {
        value
      }
      subtitle {
        value
      }
      description {
        value
      }
      giftDescription {
        value
      }
      numberOfPostsPerInfluencer {
        value
      }
      postMedia {
        value
      }
      postIntervalStart {
        value
      }
      postIntervalEnd {
        value
      }
      contentSpecifics {
        value
      }
      captionSpecifics {
        value
      }
      defaultAccountTags {
        value
      }
      defaultHashtags {
        value
      }
      customInputFields {
        value {
          id
          label
          value
        }
      }
    }
    company(id: $companyId) {
      id
      version
      companyLogo {
        value {
          id
        }
      }
      name {
        value
      }
    }
  }
`;

const QUERY_USER_SELECTED_COMPANY = gql`
  query SelectedCompanyDataForCampaignPreview {
    currentUser @client {
      id
      companyId
    }
  }
`;

const useStyles = makeStyles((theme: Theme) => ({
  appBarRoot: {
    height: 10,
    minHeight: 10,
  },
  border: {
    border: 'black solid 1px',
  },
  container: {
    [theme.breakpoints.down('sm')]: {
      width: 300,
    },
    [theme.breakpoints.up('sm')]: {
      width: 420,
    },
  },
  content: {
    backgroundColor: theme.palette.background.paper,
  },
  title: {
    marginBottom: theme.spacing(1.1),
  },
  description: {
    padding: theme.spacing(0.6),
    paddingTop: 0,
    whiteSpace: 'pre-line',
    fontSize: '12px',
  },
  miniHeaders: {
    padding: theme.spacing(1),
    whiteSpace: 'pre-line',
    fontWeight: 600,
    fontSize: '13px',
  },
  dealHeaders: {
    padding: theme.spacing(1.4),
    whiteSpace: 'pre-line',
    fontWeight: 600,
    fontSize: '16px',
  },
  descriptionContainer: {},
  phoneBorder: {
    backgroundColor: theme.palette.background.default,
    border: 'black solid 1px',
    borderRadius: theme.spacing(3),
    padding: '40px 8px',
  },
  phoneCompanyTitle: {
    fontSize: 14,
    overflow: 'hidden',
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    textAlign: 'center',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  phoneTopBar: {
    height: theme.spacing(3),
  },
  phoneTopBarItem: {
    fontSize: theme.spacing(2),
  },
}));

type Props = {
  campaignDraftId: string;
};

const MobilePhoneCampaignPreview: FC<Props> = ({ campaignDraftId }) => {
  const {
    border,
    phoneBorder,
    container,
    content,
    title,
    description,
    miniHeaders,
    phoneTopBar,
    phoneTopBarItem,
    phoneCompanyTitle,
  } = useStyles();

  const { data: selectedCompanyData } = useBHQuery<SelectedCompanyDataForCampaignPreview>(QUERY_USER_SELECTED_COMPANY);
  const selectedCompanyId = getProp(selectedCompanyData)
    .on('currentUser')
    .on('companyId')
    .get();

  const { data, loading } = useBHQuery<
    QueryMobilePhoneCampaignPreviewData,
    QueryMobilePhoneCampaignPreviewDataVariables
  >(QUERY_MOBILE_PHONE_CAMPAIGN_PREVIEW_DATA, {
    variables: { campaignDraftId, companyId: selectedCompanyId || '' },
    skip: !isDefined(selectedCompanyId),
  });

  const getCoverImageOrFirstInspirationImage = () => {
    const coverImageId = getProp(data)
      .on('campaignDraft')
      .onValue('coverImage')
      .on('id')
      .get();
    const inspirationImages = getProp(data)
      .on('campaignDraft')
      .onValue('inspirationImages')
      .get();

    const inspirationImagesIds = inspirationImages
      ? inspirationImages.map(image =>
          getProp(image)
            .on('id')
            .get(),
        )
      : [];

    if (inspirationImagesIds.length === 0) {
      return '';
    }

    return inspirationImagesIds.find(imageId => imageId === coverImageId) || inspirationImagesIds[0];
  };

  const getAvatarImage = () => {
    const defaultAvatarLogoId = getProp(data)
      .on('company')
      .onValue('companyLogo')
      .on('id')
      .get();
    const customAvatarLogoId = getProp(data)
      .on('campaignDraft')
      .onValue('companyLogo')
      .on('id')
      .get();

    return customAvatarLogoId ? customAvatarLogoId : defaultAvatarLogoId ? defaultAvatarLogoId : '';
  };

  const postMedia =
    getProp(data)
      .on('campaignDraft')
      .onValue('postMedia')
      .get() || [];

  const numberOfPostsPerInfluencer =
    getProp(data)
      .on('campaignDraft')
      .onValue('numberOfPostsPerInfluencer')
      .get() || 1;

  const postIntervalStart = DateTime.fromISO(
    getProp(data)
      .on('campaignDraft')
      .onValue('postIntervalStart')
      .get() || '',
  );

  const postIntervalEnd = DateTime.fromISO(
    getProp(data)
      .on('campaignDraft')
      .onValue('postIntervalEnd')
      .get() || '',
  );

  const defaultHashtags =
    getProp(data)
      .on('campaignDraft')
      .onValue('defaultHashtags')
      .get() || [];

  const defaultAccountTags =
    getProp(data)
      .on('campaignDraft')
      .onValue('defaultAccountTags')
      .get() || '';

  const giftDescription = getProp(data)
    .on('campaignDraft')
    .onValue('giftDescription')
    .get();

  const captionSpecifics =
    getProp(data)
      .on('campaignDraft')
      .onValue('captionSpecifics')
      .get() || '';

  const captionSpecificsText = `${captionSpecifics} ${defaultAccountTags} in the beginning of your caption\n${defaultHashtags.join(
    ' ',
  )}`;

  const customInputFields =
    getProp(data)
      .on('campaignDraft')
      .onValue('customInputFields')
      .get() || [];

  const getPostMediaLabel = (postMediaType: PostMediaType) => {
    switch (postMediaType) {
      case 'InstagramFeed':
        return numberOfPostsPerInfluencer > 1 ? 'Instagram posts' : 'Instagram post';
      case 'InstagramStory':
        return numberOfPostsPerInfluencer > 1 ? 'Instagram stories' : 'Instagram story';
      case 'TikTokPost':
        return numberOfPostsPerInfluencer > 1 ? 'TikTok posts' : 'TikTok post';
      default:
        return '';
    }
  };

  return (
    <div className={classNames([container, phoneBorder])}>
      <div className={classNames([content, border])}>
        {loading ? (
          <Loading variant="linear" />
        ) : (
          <Grid direction="column" spacing={1} container={true}>
            <Grid xs={12} item={true}>
              <Grid
                className={phoneTopBar}
                container={true}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
              >
                <Grid xs={5} item={true}>
                  <Grid container={true} alignItems="center" direction="row">
                    <Grid item={true}>
                      <Signal className={phoneTopBarItem} />
                    </Grid>
                    <Grid item={true}>
                      <Typography className={phoneTopBarItem}>TELMORE 4G</Typography>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid xs={2} item={true}>
                  <Typography align="center" className={phoneTopBarItem}>
                    18:47
                  </Typography>
                </Grid>
                <Grid xs={5} item={true}>
                  <Grid container={true} direction="row" alignItems="center" justifyContent="flex-end">
                    <Grid item={true}>
                      <Bluetooth className={phoneTopBarItem} />
                    </Grid>
                    <Grid item={true}>
                      <Typography className={phoneTopBarItem}>96%</Typography>
                    </Grid>
                    <Grid item={true}>
                      <Battery className={phoneTopBarItem} />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item={true}>
              <Grid container={true} justifyContent="space-between" alignItems="center" direction="row">
                <Grid item={true} xs={1}>
                  <IosBack color="primary" />
                </Grid>
                <Grid item={true} xs={10}>
                  <Typography color="primary" variant="body1" className={phoneCompanyTitle}>
                    {getProp(data)
                      .on('company')
                      .onValue('name')
                      .get() || 'NO_COMP'}
                  </Typography>
                </Grid>
                <Grid item={true} xs={1}>
                  <Upload color="primary" />
                </Grid>
              </Grid>
            </Grid>
            <Grid item={true}>
              <ImageWithAvatar
                imageId={getCoverImageOrFirstInspirationImage()}
                avatarImageId={getAvatarImage()}
                useLightbox={true}
              />
            </Grid>
            <Grid item={true}>
              <Typography align="center" variant="h6" className={title}>
                {getProp(data)
                  .on('campaignDraft')
                  .onValue('title')
                  .get() || ''}
              </Typography>
              <Typography align="center" className={description}>
                {getProp(data)
                  .on('campaignDraft')
                  .onValue('subtitle')
                  .get() || ''}
              </Typography>
              <BHSpacer />
              <Divider />
              <BHSpacer />
            </Grid>
            <Grid item={true}>
              <Grid container={true} direction="column" alignItems="center">
                <Grid item={true} xs={12}>
                  <Typography align="center" color="textSecondary" className={description}>
                    {getProp(data)
                      .on('campaignDraft')
                      .onValue('description')
                      .get() || ''}
                  </Typography>
                </Grid>

                {!!giftDescription && (
                  <Grid item={true} xs={12}>
                    <Typography align="center" color="textSecondary" className={miniHeaders}>
                      Gifting
                    </Typography>
                    <Typography align="center" color="textSecondary" className={description}>
                      {giftDescription}
                    </Typography>
                  </Grid>
                )}

                <Grid item={true} xs={12}>
                  <Typography align="center" color="textSecondary" className={miniHeaders}>
                    Content Specifics
                  </Typography>
                  <Typography align="center" color="textSecondary" className={description}>
                    {getProp(data)
                      .on('campaignDraft')
                      .onValue('numberOfPostsPerInfluencer')
                      .get() || ''}
                    {`x ${getPostMediaLabel(postMedia[0])}`}
                    {'\n'}
                    {getProp(data)
                      .on('campaignDraft')
                      .onValue('contentSpecifics')
                      .get() || ''}
                  </Typography>
                </Grid>

                {customInputFields.map(fields => {
                  return (
                    <Grid item={true} xs={12} key={fields.id}>
                      <Typography align="center" color="textSecondary" className={miniHeaders}>
                        {fields.label}
                      </Typography>
                      <Typography align="center" color="textSecondary" className={description}>
                        {fields.value}
                      </Typography>
                    </Grid>
                  );
                })}

                {postIntervalStart.isValid || postIntervalEnd.isValid ? (
                  <Grid item={true} xs={12}>
                    <Typography align="center" color="textSecondary" className={miniHeaders}>
                      Post Timing
                    </Typography>

                    <Typography align="center" color="textSecondary" className={description}>
                      {postIntervalStart?.isValid
                        ? postIntervalStart.toLocaleString({ ...DateTime.DATE_FULL, numberingSystem: undefined })
                        : 'Start date not set'}
                      {' - '}
                      {postIntervalEnd?.isValid
                        ? postIntervalEnd.toLocaleString({ ...DateTime.DATE_FULL, numberingSystem: undefined })
                        : 'End date not set'}
                    </Typography>
                  </Grid>
                ) : null}

                <Grid item={true} xs={12}>
                  <Typography align="center" color="textSecondary" className={miniHeaders}>
                    Caption Specifics
                  </Typography>
                  <Typography align="center" color="textSecondary" className={description}>
                    {captionSpecificsText}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}
      </div>
    </div>
  );
};

export default MobilePhoneCampaignPreview;
