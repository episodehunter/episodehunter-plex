import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { LoginRow } from '../LoginRow';

test('that LoginRow renders', () => {
  const tree = renderer.create(
    <LoginRow status={0} buttonText="Button text!" onButtonClick={() => {}} />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
