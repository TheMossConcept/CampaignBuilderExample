import { FormHelperText, Grid, IconButton, ListItemIcon, TextField, Typography } from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import QuestionIcon from '@material-ui/icons/Poll';
import React, { FC, SyntheticEvent, useEffect, useState } from 'react';

type QuestionType = { text: string; order?: number | null | undefined };
interface IQuestionProps {
  question: QuestionType;
  edit?: (newQuestionText: string) => void;
  remove?: () => void;
  onTextFieldClick?: (event: React.MouseEvent<HTMLInputElement>) => void;
  iconEnabled?: boolean;
  maxLength?: number;
  validator?: (text: string) => string;
}

type Props = IQuestionProps;

const Question: FC<Props> = ({
  question,
  edit,
  remove,
  onTextFieldClick,
  iconEnabled = true,
  maxLength,
  validator,
}) => {
  const [editQuestion, setEditQuestion] = useState(false);
  const [error, setError] = useState('');
  const [questionText, setQuestionText] = useState(question.text);

  useEffect(() => {
    setQuestionText(question.text);
  }, [question]);

  const endEdit = (e: SyntheticEvent) => {
    if (edit) {
      edit(questionText);
    }
    e.stopPropagation();
    setEditQuestion(false);
  };

  return (
    <Grid container={true}>
      <Grid item={true} xs={12}>
        <Grid container={true} alignItems="center">
          {iconEnabled && (
            <Grid item={true}>
              <ListItemIcon>
                <QuestionIcon />
              </ListItemIcon>
            </Grid>
          )}
          {editQuestion && edit ? (
            <>
              <Grid item={true} xs={true}>
                <TextField
                  fullWidth={true}
                  multiline={true}
                  value={questionText}
                  onClick={onTextFieldClick}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    const newValue = event.target.value;
                    if (validator) {
                      const errorString = validator(newValue);
                      setError(errorString);
                    }
                    setQuestionText(newValue);
                  }}
                  onKeyPress={(event: React.KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === 'Enter' && error.length === 0 && !event.shiftKey) {
                      endEdit(event);
                    }
                  }}
                />
              </Grid>
              <Grid item={true}>
                <IconButton color="primary" disabled={error.length > 0} onClick={endEdit}>
                  <CheckIcon />
                </IconButton>
              </Grid>
              {maxLength && (
                <Grid item={true} xs={12}>
                  <FormHelperText
                    error={questionText.length > maxLength}
                  >{`${questionText.length}/${maxLength}`}</FormHelperText>
                </Grid>
              )}
              {error && error.length > 0 && (
                <Grid item={true} xs={12}>
                  <FormHelperText error={true}>{error}</FormHelperText>
                </Grid>
              )}
            </>
          ) : (
            <>
              <Grid item={true} xs={true}>
                <Typography style={{ wordBreak: 'break-word' }}>{questionText}</Typography>
              </Grid>
              {edit && (
                <Grid item={true}>
                  <IconButton
                    color="primary"
                    onClick={(event: React.MouseEvent<HTMLElement>) => {
                      // Otherwise, the expansion panel will open and close each time the button is pressed
                      event.stopPropagation();
                      setEditQuestion(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Grid>
              )}
              {remove && (
                <Grid item={true}>
                  <IconButton
                    onClick={(event: React.MouseEvent<HTMLElement>) => {
                      // Otherwise, the expansion panel will open and close each time the button is pressed
                      event.stopPropagation();
                      remove();
                    }}
                    color="secondary"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Question;
