import { Fab, FormHelperText, Grid, makeStyles, Theme } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import React, { FC, PropsWithChildren, useState } from 'react';

import { MediaUpdateActionEnum, MediaUpdateInput } from '../../../__generated__/types';
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
    position: 'absolute',
    top: 0,
    right: 0,
    paddingTop: '18px',
    paddingRight: '24px',
  },
}));

type Props = {
  // Receive ids, update MediaUpdateInput
  updateMedia: (newValue: MediaUpdateInput[]) => void;
  // This is just the id of an already updated file
  loading?: boolean;
} & Omit<UploadImageDropzoneProps, 'onAddImages'>;

export const MediaUpload = ({
  updateMedia,
  loading,
  multiple = true,
  ...imageUploadDropzoneProps
}: PropsWithChildren<Props>): ReturnType<FC<Props>> => {
  const [addedMedia, setAddedMedia] = useState<File[]>([]);
  const [error, setError] = useState('');

  const setMediaHandler = (media: File[]) => {
    const sizeOfNewMedia = media
      .flatMap(x => x.size)
      .reduce((sum, size) => {
        return sum + size;
      }, 0);

    if (sizeOfNewMedia >= maxUploadSize) {
      if (addedMedia.length > 1) {
        setError('You are trying to upload more than 300MB at once. Please try uploading less at once.');
      } else {
        setError('We currently do not support uploading files larger than 300MB');
      }
    } else {
      setError('');
      setAddedMedia(media);
      const addedMediaUpdateInput = media.map(file => ({
        action: MediaUpdateActionEnum.CREATE,
        file,
      }));
      updateMedia(addedMediaUpdateInput);
    }
  };

  const { unsavedMediaContainer, mediaToggleFab } = useStyles();

  return (
    <>
      <Grid container={true} spacing={2}>
        <Grid item={true} xs={12}>
          <UploadImageDropzone
            onAddImages={(_, files) => setMediaHandler(files || [])}
            returnFiles={true}
            multiple={multiple}
            allowVideo={true}
            {...imageUploadDropzoneProps}
          >
            <Grid container={true} spacing={2} alignItems="center" justifyContent={multiple ? 'flex-start' : 'center'}>
              <>
                {addedMedia.map((currentMedia, idx) => {
                  const addedMediaUrl = URL.createObjectURL(currentMedia);

                  const isImage = currentMedia.type.includes('image');
                  const isVideo = currentMedia.type.includes('video');
                  return (
                    <Grid key={`${addedMediaUrl}:${idx}`} item={true} xs={12} sm={4} className={unsavedMediaContainer}>
                      <BHMedia
                        imageSrc={isImage ? addedMediaUrl : undefined}
                        videoSrc={isVideo ? addedMediaUrl : undefined}
                      />
                      <Fab
                        color="secondary"
                        size="small"
                        onClick={(event: React.MouseEvent<HTMLElement>) => {
                          event.stopPropagation();
                          setMediaHandler(addedMedia.filter(x => x.name !== currentMedia.name));
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
          </UploadImageDropzone>
        </Grid>

        {error.length > 0 && (
          <Grid item xs={12}>
            <Grid container justifyContent={'center'}>
              <FormHelperText error={true}>{error}</FormHelperText>
            </Grid>
          </Grid>
        )}
      </Grid>
    </>
  );
};
