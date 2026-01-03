import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card } from '@/components/ui';
import { designTokens } from '@/design-system';
import { PageHeader, ColorSwatch, ColorPalette, ShowcaseGrid } from './components';

export function ColorsTypography() {
  return (
    <AuthenticatedLayout>
      <div className="p-6 space-y-8">
        <PageHeader
          title="Colors & Typography"
          description="Complete color palette, typography scale, spacing, shadows, and border radius tokens."
        />

      {/* Primary Colors */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Primary Colors (Emerald)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Brand primary color with full shade scale
          </p>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-wrap gap-3">
            {Object.entries(designTokens.colors.primary).map(([shade, hex]) => {
              if (shade === 'DEFAULT') return null;
              return <ColorSwatch key={shade} name={shade} hex={hex as string} />;
            })}
          </div>
        </Card.Body>
      </Card>

      {/* Gray Scale */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Gray Scale
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Neutral colors for text, borders, and backgrounds
          </p>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-wrap gap-3">
            {Object.entries(designTokens.colors.gray).map(([shade, hex]) => (
              <ColorSwatch key={shade} name={shade} hex={hex as string} />
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Semantic Colors */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Semantic Colors
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Colors for feedback and status
          </p>
        </Card.Header>
        <Card.Body>
          <ShowcaseGrid cols={4}>
            <ColorPalette name="Success" colors={designTokens.colors.success} />
            <ColorPalette name="Warning" colors={designTokens.colors.warning} />
            <ColorPalette name="Error" colors={designTokens.colors.error} />
            <ColorPalette name="Info" colors={designTokens.colors.info} />
          </ShowcaseGrid>
        </Card.Body>
      </Card>

      {/* Dark Mode Colors */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Dark Mode Surfaces
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Background and surface colors for dark theme
          </p>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-wrap gap-3">
            {Object.entries(designTokens.colors.dark).map(([name, hex]) => (
              <ColorSwatch key={name} name={name} hex={hex as string} />
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Brand Colors */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Brand Neutrals
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="flex gap-3">
            <ColorSwatch name="Black" hex={designTokens.colors.brand.black} />
            <ColorSwatch name="White" hex={designTokens.colors.brand.white} />
          </div>
        </Card.Body>
      </Card>

      {/* Font Family */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Font Family
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Primary and monospace typefaces
          </p>
        </Card.Header>
        <Card.Body>
          <div className="space-y-6">
            {/* Sans Font */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-primary">sans</span>
                <span className="text-xs text-gray-400">
                  {designTokens.typography.fontFamily.sans.join(', ')}
                </span>
              </div>
              <p className="text-2xl font-normal text-gray-900 dark:text-white" style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}>
                The quick brown fox jumps over the lazy dog
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: designTokens.typography.fontFamily.sans.join(', ') }}>
                ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
              </p>
            </div>

            {/* Mono Font */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-primary">mono</span>
                <span className="text-xs text-gray-400">
                  {designTokens.typography.fontFamily.mono.join(', ')}
                </span>
              </div>
              <p className="text-xl text-gray-900 dark:text-white" style={{ fontFamily: designTokens.typography.fontFamily.mono.join(', ') }}>
                The quick brown fox jumps over the lazy dog
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400" style={{ fontFamily: designTokens.typography.fontFamily.mono.join(', ') }}>
                ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Typography Scale */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Typography Scale
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Font sizes from 2xs to 5xl
          </p>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            {Object.entries(designTokens.typography.fontSize).map(([name, value]) => {
              const [size, config] = value as [string, { lineHeight: string }];
              return (
                <div key={name} className="flex items-baseline gap-4 py-2 border-b border-gray-100 dark:border-dark-border last:border-0">
                  <span className="w-16 text-xs font-mono text-gray-500 dark:text-gray-400">
                    {name}
                  </span>
                  <span
                    className="flex-1 text-gray-900 dark:text-white"
                    style={{ fontSize: size, lineHeight: config.lineHeight }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </span>
                  <span className="text-2xs text-gray-400 font-mono">
                    {size} / {config.lineHeight}
                  </span>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>

      {/* Font Weights */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Font Weights
          </h3>
        </Card.Header>
        <Card.Body>
          <div className="space-y-3">
            {Object.entries(designTokens.typography.fontWeight).map(([name, weight]) => (
              <div key={name} className="flex items-center gap-4">
                <span className="w-24 text-xs font-mono text-gray-500 dark:text-gray-400">
                  {name} ({weight})
                </span>
                <span
                  className="text-sm text-gray-900 dark:text-white"
                  style={{ fontWeight: weight as string }}
                >
                  The quick brown fox jumps over the lazy dog
                </span>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Spacing */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Spacing Scale
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Consistent spacing values for margins and paddings
          </p>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-wrap items-end gap-3">
            {Object.entries(designTokens.spacing)
              .filter(([key]) => !isNaN(Number(key)) && Number(key) <= 16)
              .map(([key, value]) => (
                <div key={key} className="flex flex-col items-center">
                  <div
                    className="bg-primary rounded"
                    style={{ width: value, height: value }}
                  />
                  <span className="text-2xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                    {key}
                  </span>
                  <span className="text-2xs text-gray-400">
                    {value}
                  </span>
                </div>
              ))}
          </div>
        </Card.Body>
      </Card>

      {/* Shadows */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Shadows
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Box shadow tokens for elevation
          </p>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-wrap gap-6">
            {Object.entries(designTokens.shadows)
              .filter(([key]) => key !== 'none' && key !== 'inner')
              .map(([name, shadow]) => (
                <div key={name} className="flex flex-col items-center">
                  <div
                    className="w-20 h-20 bg-white dark:bg-dark-card rounded-lg"
                    style={{ boxShadow: shadow as string }}
                  />
                  <span className="text-2xs text-gray-500 dark:text-gray-400 mt-2 font-mono">
                    {name === 'DEFAULT' ? 'default' : name}
                  </span>
                </div>
              ))}
          </div>
        </Card.Body>
      </Card>

      {/* Border Radius */}
      <Card variant="bordered">
        <Card.Header>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Border Radius
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Rounded corner tokens
          </p>
        </Card.Header>
        <Card.Body>
          <div className="flex flex-wrap gap-6">
            {Object.entries(designTokens.borderRadius)
              .filter(([key]) => key !== 'none' && key !== 'full')
              .map(([name, radius]) => (
                <div key={name} className="flex flex-col items-center">
                  <div
                    className="w-16 h-16 bg-primary"
                    style={{ borderRadius: radius as string }}
                  />
                  <span className="text-2xs text-gray-500 dark:text-gray-400 mt-2 font-mono">
                    {name === 'DEFAULT' ? 'default' : name}
                  </span>
                  <span className="text-2xs text-gray-400">
                    {radius}
                  </span>
                </div>
              ))}
          </div>
        </Card.Body>
      </Card>
      </div>
    </AuthenticatedLayout>
  );
}
