import React from 'react';
import {
  Box,
  Button,
  Text,
  Avatar,
  Row,
  Stack,
  Container,
  Heading,
} from 'gestalt';
import 'gestalt/dist/gestalt.css';
import { auth } from '../Firebase/firebase';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, setUser } from '../Firebase/firebaseSlice';
import { navigate } from '@reach/router';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { displayName, photoURL, email } = user;

  return (
    <Box padding={3}>
      <Container>
        <Box padding={3}>
          <Row gap={1}>
            <Container>
              <Heading size="lg">PDFTron Sign App</Heading>
            </Container>
            <Avatar name={displayName} size="md" src={photoURL} />
            <Stack>
              <Text weight="bold">{displayName}</Text>
              <Text>{email}</Text>
            </Stack>
            <Button
              onClick={() => {
                auth.signOut();
                dispatch(setUser(null));
                navigate('/');
              }}
              accessibilityLabel="Sign out of your account"
              text="Sign out"
            />
          </Row>
        </Box>
      </Container>
    </Box>
  );
};
export default ProfilePage;
