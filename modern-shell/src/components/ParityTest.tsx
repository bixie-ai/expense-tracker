import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

export function ParityTest() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Typography variant="h4" className="mb-4">
        Parity Test: MUI + Tailwind
      </Typography>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* MUI Button styled with Tailwind override */}
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-2">
              MUI Button (default)
            </Typography>
            <Button variant="contained" color="primary">
              Material Button
            </Button>
          </CardContent>
        </Card>

        {/* MUI Button with Tailwind override demonstrating CSS injection order */}
        <Card>
          <CardContent>
            <Typography variant="h6" className="mb-2">
              Tailwind Override
            </Typography>
            <Button
              variant="contained"
              className="bg-secondary rounded-none shadow-none"
            >
              Tailwind Styled
            </Button>
          </CardContent>
        </Card>

        {/* Angular Material 3 color parity */}
        <Card className="col-span-1 md:col-span-2">
          <CardContent>
            <Typography variant="h6" className="mb-3">
              Angular Material 3 Color Parity
            </Typography>
            <div className="flex flex-wrap gap-3">
              <div className="w-16 h-16 rounded-md bg-primary flex items-center justify-center">
                <span className="text-white text-xs">Primary</span>
              </div>
              <div className="w-16 h-16 rounded-md bg-secondary flex items-center justify-center">
                <span className="text-white text-xs">Secondary</span>
              </div>
              <div className="w-16 h-16 rounded-md bg-tertiary flex items-center justify-center">
                <span className="text-white text-xs">Tertiary</span>
              </div>
              <div className="w-16 h-16 rounded-md bg-error flex items-center justify-center">
                <span className="text-white text-xs">Error</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
