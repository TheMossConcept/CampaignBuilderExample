import { isDefined } from '@brandheroes/brandheroes-shared-project';
import { Button, Fab, FormHelperText, Grid, IconButton, makeStyles, Theme, Typography } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import CoverIcon from '@material-ui/icons/Favorite';
import SaveIcon from '@material-ui/icons/Save';
import { difference, isEmpty } from 'lodash';
import React, { FC, PropsWithChildren, useEffect, useState, MouseEvent } from 'react';
import { mixed, SchemaOf } from 'yup';

import { MediaUpdateActionEnum, MediaUpdateInput } from '../../../__generated__/types';
import { useInputValidation } from '../../../hooks/validation';
import Loading from '../Loading';
import BHMedia from '../media/BHMedia';
import UploadImageDropzone, { UploadImageDropzoneProps } from '../upload/UploadImageDropzone';

const maxUploadSize = 299000000; // 99MB

const useStyles = makeStyles<Theme>((theme: Theme) => ({
  coverFab: {
    bottom: theme.spacing(3),
    left: theme.spacing(3),
    position: 'absolute',
  },
  mediaToggleFab: {
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    position: 'absolute',
  },
  mediaContainer: {
    position: 'relative',
  },
  unsavedMediaContainer: {
    position: 'relative',
    opacity: 0.5,
  },
  saveIconContainer: {
    // position: 'absolute',
    top: 0,
    right: 0,
    paddingTop: '18px',
    paddingRight: '24px',
  },
}));

type MediaType = {
  src: string;
  id: string;
  isVideo: boolean;
  isImage: boolean;
};

type Props<T> = {
  // Receive ids, update MediaUpdateInput
  initialMedia: MediaType[];
  updateMedia: (newValue: MediaUpdateInput[]) => void;
  // This is just the id of an already updated file
  secondaryState?: [string | undefined, (newValue: string) => void];
  validator?: SchemaOf<T | undefined>;
  closeIfDialog?: () => void;
  loading?: boolean;
} & Omit<UploadImageDropzoneProps, 'onAddImages'>;

const MediaUploadInput = <T extends {}>({
  initialMedia,
  updateMedia,
  secondaryState,
  validator,
  closeIfDialog,
  loading,
  multiple = true,
  ...imageUploadDropzoneProps
}: PropsWithChildren<Props<T>>): ReturnType<FC<Props<T>>> => {
  const [addedMedia, setAddedMedia] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [mediaToDelete, setMediaToDelete] = useState<MediaType[]>([]);
  const [stateForValidation, setStateForValidation] = useState<(File | MediaType)[]>([]);

  useEffect(() => {
    setAddedMedia([]);
    setMediaToDelete([]);
  }, [initialMedia]);

  useEffect(() => {
    const sizeOfNewMedia = addedMedia
      .flatMap(x => x.size)
      .reduce((sum, size) => {
        return sum + size;
      }, 0);

    if (sizeOfNewMedia >= maxUploadSize) {
      if (addedMedia.length > 1) {
        setError('You are trying to upload more than 300MB at once. Please try uploading less at once.');
      } else {
        setError('We currently do not support uploading files larger than 100MB');
      }
    } else {
      setError('');
    }
  }, [addedMedia]);

  const updateMediaWrapper = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    const addedMediaUpdateInput = addedMedia.map(addedMedia => ({
      action: MediaUpdateActionEnum.CREATE,
      file: addedMedia,
    }));
    const removedMediaUpdateInput = mediaToDelete.map(mediaIdToDelete => ({
      action: MediaUpdateActionEnum.REMOVE,
      targetId: mediaIdToDelete.id,
    }));

    updateMedia([...addedMediaUpdateInput, ...removedMediaUpdateInput]);
  };

  const { didPassValidation, validationError, setValueWithValidation } = useInputValidation(
    [stateForValidation, setStateForValidation],
    /* We would like the validator to be optional, but since we cannot call a hook
     * conditionally and since it does not make sense for useInputValidation to take
     * an optional validator, we just use a validator which will always yield true
     */
    validator || mixed(),
  );

  const mediaHasChanged = !isEmpty(addedMedia) || !isEmpty(mediaToDelete);
  const disableSave = !didPassValidation || !mediaHasChanged;

  /*
   * State for validation is derived from addedMedia, mediaToDelete and initialMedia
   * and is needed since we need to take both added and deleted media into account.
   * These come from two different sources as we retrive string ids from the backend
   * (these are deleted) and add files that are created on demand on the frontend (these are added)
   */
  useEffect(() => {
    const mediaAfterDeletion = difference(initialMedia, mediaToDelete);

    // If setValueWithValidation is called without the media having changed, the pristine value will become incorrect
    if (mediaHasChanged) {
      setValueWithValidation([...mediaAfterDeletion, ...addedMedia]);
    } else {
      setStateForValidation([...mediaAfterDeletion, ...addedMedia]);
    }
  }, [addedMedia, mediaHasChanged, mediaToDelete, initialMedia, setValueWithValidation]);

  const [secondaryValue, setSecondaryValue] = secondaryState || [undefined, undefined];

  const { mediaContainer, unsavedMediaContainer, mediaToggleFab, coverFab } = useStyles();

  return (
    <>
      {/* It does not make sense to have an intermediate save in a dialog
			    (which already have a save button in the bottom), if only one media
					can be uploaded 
			*/}
      <Grid container={true} spacing={2}>
        <Grid item={true} xs={12}>
          <UploadImageDropzone
            onAddImages={(_, files) => setAddedMedia(files || [])}
            returnFiles={true}
            multiple={multiple}
            allowVideo={true}
            {...imageUploadDropzoneProps}
          >
            <Grid container justify="flex-end">
              {!multiple && isDefined(closeIfDialog) ? null : (
                <Grid item>
                  <IconButton
                    color={mediaHasChanged ? 'primary' : 'default'}
                    disabled={disableSave}
                    onClick={updateMediaWrapper}
                  >
                    {loading ? <Loading variant="button" /> : <SaveIcon />}
                  </IconButton>
                </Grid>
              )}
              <Grid item xs={12}>
                <Grid
                  container={true}
                  spacing={2}
                  alignItems="center"
                  justifyContent={multiple ? 'flex-start' : 'center'}
                >
                  <>
                    {(multiple || isEmpty(addedMedia)) &&
                      initialMedia.map((media, idx) => {
                        const isImage = media.isImage;
                        const isVideo = media.isVideo;

                        const mediaId = media.id;
                        const mediaIsDeleted = mediaToDelete.includes(media);
                        return (
                          <Grid
                            key={`${mediaId}:${idx}`}
                            item={true}
                            xs={12}
                            sm={4}
                            className={mediaIsDeleted ? unsavedMediaContainer : mediaContainer}
                          >
                            <BHMedia
                              imageSrc={isImage ? media.src : undefined}
                              videoSrc={isVideo ? media.src : undefined}
                            />
                            <Fab
                              color={mediaIsDeleted ? 'primary' : 'secondary'}
                              size="small"
                              onClick={(event: React.MouseEvent<HTMLElement>) => {
                                event.stopPropagation();
                                setMediaToDelete(previousValue =>
                                  mediaIsDeleted
                                    ? previousValue.filter(deleteMedia => deleteMedia !== media)
                                    : [...previousValue, media],
                                );
                              }}
                              className={mediaToggleFab}
                            >
                              {mediaIsDeleted ? <AddIcon /> : <DeleteIcon />}
                            </Fab>
                            {!mediaIsDeleted && secondaryState && !isVideo && (
                              <Fab
                                color={mediaId === secondaryValue ? 'primary' : 'default'}
                                size="small"
                                onClick={
                                  setSecondaryValue
                                    ? (event: React.MouseEvent<HTMLElement>) => {
                                        event.stopPropagation();
                                        setSecondaryValue(mediaId);
                                      }
                                    : undefined
                                }
                                className={coverFab}
                              >
                                <CoverIcon />
                              </Fab>
                            )}
                          </Grid>
                        );
                      })}
                    {addedMedia.map((currentMedia, idx) => {
                      const addedMediaUrl = URL.createObjectURL(currentMedia);

                      const isImage = currentMedia.type.includes('image');
                      const isVideo = currentMedia.type.includes('video');
                      return (
                        <Grid
                          key={`${addedMediaUrl}:${idx}`}
                          item={true}
                          xs={12}
                          sm={4}
                          className={unsavedMediaContainer}
                        >
                          <BHMedia
                            imageSrc={isImage ? addedMediaUrl : undefined}
                            videoSrc={isVideo ? addedMediaUrl : undefined}
                          />
                          <Fab
                            color="secondary"
                            size="small"
                            onClick={(event: React.MouseEvent<HTMLElement>) => {
                              event.stopPropagation();
                              setAddedMedia(addedMedia.filter(mediaToDelete => currentMedia !== mediaToDelete));
                            }}
                            className={mediaToggleFab}
                          >
                            <DeleteIcon />
                          </Fab>
                        </Grid>
                      );
                    })}
                  </>
                </Grid>
              </Grid>
            </Grid>
          </UploadImageDropzone>
        </Grid>
        {validationError ? (
          <Grid item={true} xs={12}>
            <Typography align="center" color="error" variant="caption">
              {validationError}
            </Typography>
          </Grid>
        ) : null}
        {error.length > 0 && (
          <Grid item xs={12}>
            <Grid container justifyContent={'center'}>
              <FormHelperText error={true}>{error}</FormHelperText>
            </Grid>
          </Grid>
        )}
        {closeIfDialog && (
          <Grid item={true} xs={12}>
            <Grid container={true} justifyContent="flex-end" spacing={2}>
              <Grid item={true}>
                <Button onClick={closeIfDialog}>{mediaHasChanged ? 'Cancel' : 'Close'}</Button>
              </Grid>
              {mediaHasChanged && (
                <Grid item={true}>
                  <Button
                    color="primary"
                    variant="contained"
                    disabled={disableSave || error.length > 0}
                    onClick={event => {
                      updateMediaWrapper(event);
                      closeIfDialog();
                    }}
                  >
                    Save and close
                  </Button>
                </Grid>
              )}
            </Grid>
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default MediaUploadInput;
