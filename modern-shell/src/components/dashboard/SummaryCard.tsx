import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import Icon from '@mui/material/Icon';

export interface SummaryCardProps {
  title: string;
  value: string | number;
  icon?: string;
  loading?: boolean;
}

export function SummaryCard({ title, value, icon, loading }: SummaryCardProps) {
  if (loading) {
    return (
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton width="60%" sx={{ mt: 1 }} />
            <Skeleton width="40%" />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
          {icon && (
            <Icon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }}>{icon}</Icon>
          )}
          <Typography variant="h5" component="div" sx={{ fontWeight: 500 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
