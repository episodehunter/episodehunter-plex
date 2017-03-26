import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { SyncStatus } from '../SyncStatus';

test('that SyncStatus renders', () => {
  const tree = renderer.create(
    <SyncStatus error="" />
  ).toJSON();
  expect(tree).toMatchSnapshot();
});
