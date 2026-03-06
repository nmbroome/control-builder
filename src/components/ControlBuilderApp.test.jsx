import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ControlBuilderApp } from './ControlBuilderApp';

const mockControls = {
  controls: [
    {
      id: 'BA-01',
      name: 'CIP Verification',
      source_file: 'bsa-aml.md',
      scoped_id: 'bsa-aml.md:BA-01',
      triggers: ['member.onboarded'],
      inputs: ['member.name'],
      outputs: [],
      audit_logs: [],
      primary_rules: ['31 CFR 1020.220'],
      purpose: 'Verify customer identity',
    },
    {
      id: 'BA-05',
      name: 'OFAC Screening',
      source_file: 'bsa-aml.md',
      scoped_id: 'bsa-aml.md:BA-05',
      triggers: ['payment.pre.screen'],
      inputs: ['party.name', 'party.dob'],
      outputs: ['ofac.blocked'],
      audit_logs: ['ofac.hit.reviewed'],
      primary_rules: ['31 CFR Part 501'],
      purpose: 'Screen against OFAC SDN list',
    },
    {
      id: 'FL-01',
      name: 'Protected Bases',
      source_file: 'fair-lending.md',
      scoped_id: 'fair-lending.md:FL-01',
      triggers: ['application.submitted'],
      inputs: [],
      outputs: [],
      audit_logs: [],
      primary_rules: ['ECOA'],
      purpose: 'Fair lending protected bases',
    },
  ],
};

const mockVocabulary = {
  meta: { spec_version: '1.0.0' },
  stats: { total_fields: 103, total_events: 17 },
  events: [],
  fields: [],
  entities: {},
  controls: [],
  endpoints: [],
};

function mockFetchSuccess() {
  vi.stubGlobal('fetch', vi.fn((url) => {
    if (url === '/controls.json') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockControls),
      });
    }
    if (url === '/vocabulary.json') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockVocabulary),
      });
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  }));
}

function mockFetchControlsOnly() {
  vi.stubGlobal('fetch', vi.fn((url) => {
    if (url === '/controls.json') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockControls),
      });
    }
    if (url === '/vocabulary.json') {
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
  }));
}

describe('ControlBuilderApp', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    mockFetchSuccess();
    render(<ControlBuilderApp />);
    expect(screen.getByText(/loading controls/i)).toBeInTheDocument();
  });

  it('renders controls after loading', async () => {
    mockFetchSuccess();
    render(<ControlBuilderApp />);

    await waitFor(() => {
      expect(screen.getByText('BA-01')).toBeInTheDocument();
    });

    expect(screen.getByText('BA-05')).toBeInTheDocument();
    expect(screen.getByText('FL-01')).toBeInTheDocument();
  });

  it('groups controls by source file', async () => {
    mockFetchSuccess();
    render(<ControlBuilderApp />);

    await waitFor(() => {
      // Source file appears as both a filter pill and a section header
      expect(screen.getAllByText('bsa-aml.md').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getAllByText('fair-lending.md').length).toBeGreaterThanOrEqual(1);
  });

  it('shows control count in header', async () => {
    mockFetchSuccess();
    render(<ControlBuilderApp />);

    await waitFor(() => {
      expect(screen.getByText('Controls (3)')).toBeInTheDocument();
    });
  });

  it('shows vocabulary metadata when loaded', async () => {
    mockFetchSuccess();
    render(<ControlBuilderApp />);

    await waitFor(() => {
      expect(screen.getByText(/vocab v1\.0\.0/)).toBeInTheDocument();
    });

    expect(screen.getByText(/103 fields/)).toBeInTheDocument();
    expect(screen.getByText(/17 events/)).toBeInTheDocument();
  });

  it('shows vocabulary warning when vocab fails to load', async () => {
    mockFetchControlsOnly();
    render(<ControlBuilderApp />);

    await waitFor(() => {
      expect(screen.getByText(/vocabulary not loaded/i)).toBeInTheDocument();
    });
  });

  it('opens editor when "New Control" is clicked', async () => {
    const user = userEvent.setup();
    mockFetchSuccess();
    render(<ControlBuilderApp />);

    await waitFor(() => {
      expect(screen.getByText('BA-01')).toBeInTheDocument();
    });

    await user.click(screen.getByText(/new control/i));

    // Editor should open — verify Identity section from ControlEditor is visible
    expect(screen.getByText('Identity')).toBeInTheDocument();
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('opens editor when a control card is clicked', async () => {
    const user = userEvent.setup();
    mockFetchSuccess();
    render(<ControlBuilderApp />);

    await waitFor(() => {
      expect(screen.getByText('BA-05')).toBeInTheDocument();
    });

    await user.click(screen.getByText('OFAC Screening'));

    // Editor should open with this control
    expect(screen.getByText('BA-05')).toBeInTheDocument();
    // Verify it's in the editor (check for edit tab)
    expect(screen.getByText('Identity')).toBeInTheDocument();
  });

  it('switches to requests view', async () => {
    const user = userEvent.setup();
    mockFetchSuccess();
    render(<ControlBuilderApp />);

    await waitFor(() => {
      expect(screen.getByText('Controls (3)')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Requests (0)'));
    expect(screen.getByText('Vocabulary Requests')).toBeInTheDocument();
    expect(screen.getByText(/no requests yet/i)).toBeInTheDocument();
  });

  it('shows control details in cards', async () => {
    mockFetchSuccess();
    render(<ControlBuilderApp />);

    await waitFor(() => {
      expect(screen.getByText('BA-05')).toBeInTheDocument();
    });

    // Check metadata display
    expect(screen.getByText('OFAC Screening')).toBeInTheDocument();
    expect(screen.getByText('Screen against OFAC SDN list')).toBeInTheDocument();
    // The stats line has interpolated values split across text nodes
    expect(screen.getByText(/2 inputs/)).toBeInTheDocument();
  });

  it('shows empty state when no controls exist', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url === '/controls.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ controls: [] }),
        });
      }
      if (url === '/vocabulary.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockVocabulary),
        });
      }
      return Promise.reject(new Error(`Unmocked fetch: ${url}`));
    }));

    render(<ControlBuilderApp />);

    await waitFor(() => {
      expect(screen.getByText(/no controls yet/i)).toBeInTheDocument();
    });
  });
});
