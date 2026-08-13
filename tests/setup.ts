// Pin the timezone so date-arithmetic tests (recurrence, scheduling) are
// deterministic regardless of the host machine's local timezone.
process.env.TZ = 'UTC';

import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
