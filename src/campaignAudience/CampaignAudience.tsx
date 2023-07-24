import { gql } from '@apollo/client';
import { getProp } from '@brandheroes/brandheroes-shared-project';
import { CampaignType } from '@brandheroes/shared-validation/dist/types';
import { Button, Divider, Grid, Typography } from '@material-ui/core';
import React, { FC, useEffect, useState } from 'react';
import { geocodeByPlaceId } from 'react-places-autocomplete';

import { CampaignAudienceTypeEnum, PostMediaType } from '../../../__generated__/types';
import { useBHQuery } from '../../../apollo/BHApolloProvider';
import ManageSquadsInCampaignDialog from '../../squads/manage/ManageSquadsInCampaignDialog';
import { CampaignAudienceQuery, CampaignAudienceQueryVariables } from './__generated__/CampaignAudienceQuery';
import CDraftAudienceType from './AudienceType';
import CDraftBrandcoinsValue from './BrandcoinsValue';
import { CDraftCampaignType } from './CampaignType';
import { CDraftEndDate } from './EndDate';
import CDraftGenders from './Genders';
import CDraftGlobalCampaign from './GlobalCampaign';
import { CDraftInterests } from './Interests';
import CDraftLocation from './Location';
import CDraftMaximumAge from './MaximumAge';
import CDraftMinimumAge from './MinimumAge';
import CDraftMinimumNumberOfFollowers from './MinimumNumberOfFollowers';
import CampaignNumberOfPosts from './NumberOfPosts';
import CampaignDraftNumberOfPostsPerInfluencer from './NumberOfPostsPerInfluencer';
import CDraftPostMediaType from './PostMediaTypeSelector';
import CDraftPrimaryInterest from './PrimaryInterest';
import CDraftRadius from './Radius';
import CDraftShowInSubmissionAppFeed from './ShowInSubmissionAppFeed';
import { CDraftStartDate } from './StartDate';
import CampaignDraftTargetNumberOfInfluencers from './TargetNumberOfInfluencers';
import CDraftVoucherValue from './VoucherValue';

const CAMPAIGN_AUDIENCE_QUERY = gql`
  query CampaignAudienceQuery($campaignDraftId: ID!) {
    campaignDraft(campaignDraftId: $campaignDraftId) {
      id
      version
      isGlobal {
        value
      }
      audienceType {
        value
      }
      campaignType {
        value
      }
      postMedia {
        value
      }
      location {
        value {
          id
          placeId {
            value
          }
        }
      }
    }
  }
`;

type Props = {
  campaignId: string;
  campaignDraftId: string;
  containerClass?: string;
};

const CampaignAudience: FC<Props> = ({ campaignId, campaignDraftId, containerClass }) => {
  const [squadsDialogIsOpen, setSquadsDialogIsOpen] = useState(false);
  const [selectedLocationIsCountry, setSelectedLocationIsCountry] = useState(false);

  const { data } = useBHQuery<CampaignAudienceQuery, CampaignAudienceQueryVariables>(CAMPAIGN_AUDIENCE_QUERY, {
    variables: { campaignDraftId },
  });

  const selectedPlaceId = getProp(data)
    .on('campaignDraft')
    .onValue('location')
    .onValue('placeId')
    .get();
  useEffect(() => {
    const setSelectedLocationIsCountryInState = async (placeId: string) => {
      const geocoderResults = await geocodeByPlaceId(placeId);
      // We assume our placeId maps uniquely to a geocoderResult and therefore, we take the first element of the returned array
      setSelectedLocationIsCountry(
        geocoderResults && geocoderResults.length > 0 ? geocoderResults[0].types.includes('country') : false,
      );
    };

    if (selectedPlaceId) {
      setSelectedLocationIsCountryInState(selectedPlaceId);
    }
  }, [selectedPlaceId]);

  const isGlobal =
    getProp(data)
      .on('campaignDraft')
      .onValue('isGlobal')
      .get() === true;

  const isSelected =
    getProp(data)
      .on('campaignDraft')
      .onValue('audienceType')
      .get() === CampaignAudienceTypeEnum.SELECTED;

  const isAffiliate =
    getProp(data)
      .on('campaignDraft')
      .onValue('campaignType')
      .get() === CampaignType.AFFILIATE;

  const selectedPostMediaTypes = getProp(data)
    .on('campaignDraft')
    .onValue('postMedia')
    .get();

  // Since we only allow one post media type at the moment, take the first in the array
  const selectedPostMediaType =
    selectedPostMediaTypes && selectedPostMediaTypes.length > 0 ? selectedPostMediaTypes[0] : undefined;

  return (
    <Grid container={true} spacing={2} className={containerClass}>
      <Grid item={true} xs={12}>
        <Grid container={true} justifyContent="space-between">
          <Grid item={true} xs={true}>
            <Typography variant="h4">Select your audience</Typography>
          </Grid>
          <Grid item={true}>
            <Button onClick={() => setSquadsDialogIsOpen(true)} color="primary" variant="contained">
              Manage squads
            </Button>
          </Grid>
          {campaignId && (
            <ManageSquadsInCampaignDialog
              campaignId={campaignId}
              onClose={() => setSquadsDialogIsOpen(false)}
              open={squadsDialogIsOpen}
            />
          )}
        </Grid>
      </Grid>
      <SectionHeader headerTitle="Campaign configuration" />
      <Grid item={true} xs={12}>
        <Grid container={true} spacing={1}>
          <Grid item={true}>
            <CDraftCampaignType campaignDraftId={campaignDraftId}></CDraftCampaignType>
          </Grid>
          <Grid item={true}>
            <CDraftGlobalCampaign campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true}>
            <CDraftAudienceType campaignDraftId={campaignDraftId} />
          </Grid>
          <Grid item={true}>
            <CDraftShowInSubmissionAppFeed campaignDraftId={campaignDraftId} />
          </Grid>
        </Grid>
      </Grid>
      <SectionHeader headerTitle="Campaign requirements" />
      <Grid item={true} xs={12} sm={6}>
        <CDraftMinimumNumberOfFollowers campaignDraftId={campaignDraftId} />
      </Grid>
      <Grid item={true} xs={12} sm={6}>
        <CampaignDraftTargetNumberOfInfluencers campaignDraftId={campaignDraftId} />
      </Grid>
      <Grid item={true} xs={12} sm={6}>
        <CampaignDraftNumberOfPostsPerInfluencer campaignDraftId={campaignDraftId} />
      </Grid>
      <Grid item={true} xs={12} sm={6}>
        <CampaignNumberOfPosts campaignId={campaignId} />
      </Grid>
      <SectionHeader headerTitle="Post media type and rewards" />
      <Grid item={true} xs={12}>
        <CDraftPostMediaType campaignDraftId={campaignDraftId} debounceValue={0} />
      </Grid>
      {selectedPostMediaType && (
        <Grid container={true} spacing={2}>
          <Grid item={true} xs={12}>
            {/* This is really the only good way to prevent the two types mixing state with each other  */}
            {selectedPostMediaType === PostMediaType.InstagramFeed ? (
              <CDraftVoucherValue
                campaignDraftId={campaignDraftId}
                postMediaType={PostMediaType.InstagramFeed}
                key="Feed"
              />
            ) : selectedPostMediaType === PostMediaType.InstagramStory ? (
              <CDraftVoucherValue
                campaignDraftId={campaignDraftId}
                postMediaType={PostMediaType.InstagramStory}
                key="Story"
              />
            ) : selectedPostMediaType === PostMediaType.TikTokPost ? (
              <CDraftVoucherValue
                campaignDraftId={campaignDraftId}
                postMediaType={PostMediaType.TikTokPost}
                key="TikTok post"
              />
            ) : null}
          </Grid>
          <Grid item={true} xs={12}>
            {selectedPostMediaType === PostMediaType.InstagramFeed ? (
              <CDraftBrandcoinsValue
                campaignDraftId={campaignDraftId}
                postMediaType={PostMediaType.InstagramFeed}
                key="Feed"
                excludeField={isAffiliate}
              />
            ) : selectedPostMediaType === PostMediaType.InstagramStory ? (
              <CDraftBrandcoinsValue
                campaignDraftId={campaignDraftId}
                postMediaType={PostMediaType.InstagramStory}
                key="Story"
                excludeField={isAffiliate}
              />
            ) : selectedPostMediaType === PostMediaType.TikTokPost ? (
              <CDraftBrandcoinsValue
                campaignDraftId={campaignDraftId}
                postMediaType={PostMediaType.TikTokPost}
                key="TikTok post"
                excludeField={isAffiliate}
              />
            ) : null}
          </Grid>
        </Grid>
      )}
      <SectionHeader headerTitle="Visibility filters" />
      <Grid item={true} xs={12} lg={6}>
        <Grid container={true} spacing={2}>
          <Grid item={true} xs={12}>
            <CDraftStartDate campaignDraftId={campaignDraftId} />
          </Grid>
        </Grid>
      </Grid>
      <Grid item={true} xs={12} lg={6}>
        <Grid container={true} spacing={2}>
          <Grid item={true} xs={12}>
            <CDraftEndDate campaignDraftId={campaignDraftId} />
          </Grid>
        </Grid>
      </Grid>
      {isSelected && (
        <>
          <SectionHeader headerTitle="Primary interest" />
          <Grid item={true} xs={12}>
            <CDraftPrimaryInterest campaignDraftId={campaignDraftId} />
          </Grid>
        </>
      )}
      <Grid item={true} xs={12}>
        <Grid container={true} spacing={2} alignItems="flex-end">
          <Grid item={true} xs={8}>
            <CDraftLocation campaignDraftId={campaignDraftId} excludeField={isGlobal || isSelected} />
          </Grid>
          <Grid item={true} xs={4}>
            <CDraftRadius
              campaignDraftId={campaignDraftId}
              disabled={selectedLocationIsCountry}
              excludeField={isGlobal || isSelected}
            />
          </Grid>
        </Grid>
      </Grid>
      <Grid item={true} xs={12}>
        <Grid container={true} spacing={2} alignItems="flex-end">
          <Grid item={true}>
            <CDraftGenders campaignDraftId={campaignDraftId} excludeField={isSelected} />
          </Grid>
          <Grid item={true} xs={true}>
            <CDraftMinimumAge campaignDraftId={campaignDraftId} excludeField={isSelected} />
          </Grid>
          <Grid item={true} xs={true}>
            <CDraftMaximumAge campaignDraftId={campaignDraftId} excludeField={isSelected} />
          </Grid>
        </Grid>
      </Grid>
      <Grid item={true} xs={12}>
        <CDraftInterests campaignDraftId={campaignDraftId} excludeField={isSelected} />
      </Grid>
    </Grid>
  );
};

type SectionHeaderProps = {
  headerTitle: string;
};

const SectionHeader: FC<SectionHeaderProps> = ({ headerTitle }) => {
  return (
    <>
      <Grid item={true} xs={12}>
        <Divider light={true} />
      </Grid>
      <Grid item={true} xs={12}>
        <Typography variant="subtitle2">{headerTitle}</Typography>
      </Grid>
      <Grid item={true} xs={12}>
        <Divider light={true} />
      </Grid>
    </>
  );
};

export default CampaignAudience;
