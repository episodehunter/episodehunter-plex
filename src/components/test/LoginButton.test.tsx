import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { LogInButton } from '../LoginButton';

test('that LogInButton renders', () => {
  const tree = renderer.create(
    <LogInButton buttonText="Button text!" onClick={() => {}} />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
