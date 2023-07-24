import { AccordionDetails, Grid, IconButton, ListItemIcon, TextField, Typography } from '@material-ui/core';
import { AccordionDetailsProps } from '@material-ui/core/AccordionDetails';
import CheckIcon from '@material-ui/icons/Check';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import OptionIcon from '@material-ui/icons/QuestionAnswer';
import React, { FC, useEffect, useState } from 'react';

import { MultipleChoiceQuestionOption } from '../../../../__generated__/types';

interface IOptionProps {
  option: MultipleChoiceQuestionOption;
  classes?: AccordionDetailsProps['classes'];
  editOption?: (newOptionText: string) => void;
  deleteOption?: () => void;
}

const Option: FC<IOptionProps> = ({ option, classes, editOption, deleteOption }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [optionText, setOptionText] = useState(option.text);

  useEffect(() => {
    setOptionText(option.text);
  }, [option]);

  const endEditDisabled = optionText === '';
  const endEdit = () => {
    if (!endEditDisabled) {
      if (editOption) {
        editOption(optionText);
      }

      setIsEditing(false);
    }
  };

  return (
    <Grid item={true} xs={12}>
      <AccordionDetails classes={classes}>
        <Grid container={true} alignItems="center">
          <Grid item={true}>
            <ListItemIcon>
              <OptionIcon />
            </ListItemIcon>
          </Grid>
          {isEditing && editOption ? (
            <>
              <Grid item={true} xs={true}>
                <TextField
                  value={optionText}
                  fullWidth={true}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setOptionText(event.target.value);
                  }}
                  onKeyPress={(event: React.KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Enter') {
                      endEdit();
                    }
                  }}
                />
              </Grid>
              <Grid item={true}>
                <IconButton color="primary" disabled={endEditDisabled} onClick={endEdit}>
                  <CheckIcon />
                </IconButton>
              </Grid>
            </>
          ) : (
            <>
              <Grid item={true} xs={true}>
                <Typography>{optionText}</Typography>
              </Grid>
              {editOption ? (
                <>
                  <Grid item={true}>
                    <IconButton
                      color="primary"
                      onClick={() => {
                        setIsEditing(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Grid>
                </>
              ) : null}
              {deleteOption ? (
                <>
                  <Grid item={true}>
                    <IconButton color="secondary" onClick={deleteOption}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </>
              ) : null}
            </>
          )}
        </Grid>
      </AccordionDetails>
    </Grid>
  );
};

export default Option;
