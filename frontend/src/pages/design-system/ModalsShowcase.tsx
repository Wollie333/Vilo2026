import { useState } from 'react';
import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Modal, Button, Card, Input } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader, ComponentShowcase, ShowcaseGrid, PropsTable } from './components';

const modalProps = [
  { name: 'isOpen', type: 'boolean', required: true, description: 'Control modal visibility' },
  { name: 'onClose', type: '() => void', required: true, description: 'Close handler' },
  { name: 'title', type: 'string', description: 'Modal title' },
  { name: 'size', type: "'sm' | 'md' | 'lg' | 'xl' | 'full'", default: "'md'", description: 'Modal size' },
  { name: 'closeOnOverlayClick', type: 'boolean', default: 'true', description: 'Close on backdrop click' },
  { name: 'showCloseButton', type: 'boolean', default: 'true', description: 'Show close button' },
  { name: 'footer', type: 'ReactNode', description: 'Footer content' },
];

const confirmDialogProps = [
  { name: 'isOpen', type: 'boolean', required: true, description: 'Control dialog visibility' },
  { name: 'onClose', type: '() => void', required: true, description: 'Close handler' },
  { name: 'onConfirm', type: '() => void | Promise<void>', required: true, description: 'Confirm handler' },
  { name: 'title', type: 'string', required: true, description: 'Dialog title' },
  { name: 'message', type: 'string', required: true, description: 'Dialog message' },
  { name: 'variant', type: "'danger' | 'warning' | 'info'", default: "'danger'", description: 'Dialog type' },
  { name: 'confirmText', type: 'string', default: "'Confirm'", description: 'Confirm button text' },
  { name: 'cancelText', type: 'string', default: "'Cancel'", description: 'Cancel button text' },
  { name: 'isLoading', type: 'boolean', default: 'false', description: 'Loading state' },
];

export function ModalsShowcase() {
  const [basicModal, setBasicModal] = useState(false);
  const [sizeModal, setSizeModal] = useState<string | null>(null);
  const [formModal, setFormModal] = useState(false);
  const [dangerDialog, setDangerDialog] = useState(false);
  const [warningDialog, setWarningDialog] = useState(false);
  const [infoDialog, setInfoDialog] = useState(false);

  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <PageHeader
          title="Modals & Dialogs"
          description="Modal dialogs for focused interactions and confirmation dialogs for critical actions."
        />

      {/* Modal */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Modal
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Overlay dialogs for focused content and interactions
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={2}>
            <ComponentShowcase title="Basic Modal" description="Simple modal with title and content">
              <Button onClick={() => setBasicModal(true)}>Open Basic Modal</Button>
            </ComponentShowcase>

            <ComponentShowcase title="Modal Sizes" description="Five size options">
              <Button size="sm" variant="outline" onClick={() => setSizeModal('sm')}>Small</Button>
              <Button size="sm" variant="outline" onClick={() => setSizeModal('md')}>Medium</Button>
              <Button size="sm" variant="outline" onClick={() => setSizeModal('lg')}>Large</Button>
              <Button size="sm" variant="outline" onClick={() => setSizeModal('xl')}>XL</Button>
              <Button size="sm" variant="outline" onClick={() => setSizeModal('full')}>Full</Button>
            </ComponentShowcase>

            <ComponentShowcase title="Form Modal" description="Modal with form content and footer">
              <Button onClick={() => setFormModal(true)}>Open Form Modal</Button>
            </ComponentShowcase>
          </ShowcaseGrid>
        </Card.Body>
        <Card.Footer>
          <PropsTable props={modalProps} />
        </Card.Footer>
      </Card>

      {/* Basic Modal */}
      <Modal
        isOpen={basicModal}
        onClose={() => setBasicModal(false)}
        title="Basic Modal"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This is a basic modal with a title and some content. Click outside or press
          Escape to close it.
        </p>
      </Modal>

      {/* Size Modals */}
      <Modal
        isOpen={!!sizeModal}
        onClose={() => setSizeModal(null)}
        title={`${sizeModal?.toUpperCase()} Modal`}
        size={sizeModal as 'sm' | 'md' | 'lg' | 'xl' | 'full'}
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This modal is sized as "{sizeModal}". Different sizes are useful for
          different amounts of content.
        </p>
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={formModal}
        onClose={() => setFormModal(false)}
        title="Edit Profile"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFormModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setFormModal(false)}>
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input label="Full Name" placeholder="Enter your name" fullWidth />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <Input type="email" placeholder="you@example.com" className="pl-10" fullWidth />
            </div>
          </div>
          <Input label="Bio" placeholder="Tell us about yourself" fullWidth />
        </div>
      </Modal>

      {/* ConfirmDialog */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            ConfirmDialog
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Confirmation dialogs for destructive or important actions
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={3}>
            <ComponentShowcase title="Danger" description="For destructive actions">
              <Button variant="outline" onClick={() => setDangerDialog(true)}>
                Delete Item
              </Button>
            </ComponentShowcase>

            <ComponentShowcase title="Warning" description="For cautionary actions">
              <Button variant="outline" onClick={() => setWarningDialog(true)}>
                Disable Account
              </Button>
            </ComponentShowcase>

            <ComponentShowcase title="Info" description="For informational confirmations">
              <Button variant="outline" onClick={() => setInfoDialog(true)}>
                Send Notification
              </Button>
            </ComponentShowcase>
          </ShowcaseGrid>
        </Card.Body>
        <Card.Footer>
          <PropsTable props={confirmDialogProps} />
        </Card.Footer>
      </Card>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={dangerDialog}
        onClose={() => setDangerDialog(false)}
        onConfirm={() => setDangerDialog(false)}
        variant="danger"
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
      />

      <ConfirmDialog
        isOpen={warningDialog}
        onClose={() => setWarningDialog(false)}
        onConfirm={() => setWarningDialog(false)}
        variant="warning"
        title="Disable Account"
        message="Are you sure you want to disable this account? The user will no longer be able to access the system."
        confirmText="Disable"
      />

      <ConfirmDialog
        isOpen={infoDialog}
        onClose={() => setInfoDialog(false)}
        onConfirm={() => setInfoDialog(false)}
        variant="info"
        title="Send Notification"
        message="This will send a notification to all users. Do you want to continue?"
        confirmText="Send"
      />
      </div>
    </AuthenticatedLayout>
  );
}
