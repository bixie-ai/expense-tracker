import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import CodeIcon from '@mui/icons-material/Code';

export interface NavLink {
  path: string;
  label: string;
}

export interface SocialLink {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export interface FooterLinksProps {
  navLinks?: NavLink[];
  socialLinks?: SocialLink[];
}

const DEFAULT_NAV_LINKS: NavLink[] = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/settings', label: 'Settings' },
];

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://www.linkedin.com/in/erick-boyzo-258023a1/',
    icon: <LinkedInIcon />,
    label: 'LinkedIn',
  },
  {
    href: 'https://github.com/erickboyzo',
    icon: <GitHubIcon />,
    label: 'GitHub',
  },
  {
    href: 'https://github.com/erickboyzo/expense-tracker',
    icon: <CodeIcon />,
    label: 'Source Code',
  },
];

export function FooterLinks({
  navLinks = DEFAULT_NAV_LINKS,
  socialLinks = DEFAULT_SOCIAL_LINKS,
}: FooterLinksProps) {
  return (
    <Box
      component="footer"
      role="contentinfo"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        py: 2,
      }}
    >
      <Box
        component="nav"
        aria-label="Footer navigation"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 2,
          justifyContent: 'center',
        }}
      >
        {navLinks.map((link) => (
          <MuiLink
            key={link.path}
            component={Link}
            to={link.path}
            underline="hover"
            sx={{
              color: 'text.secondary',
              fontSize: '0.875rem',
              fontWeight: 400,
              transition: 'color 0.2s ease-in-out',
              '&:hover': {
                color: 'text.primary',
              },
            }}
          >
            {link.label}
          </MuiLink>
        ))}
      </Box>

      <Divider flexItem />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
          justifyContent: 'center',
        }}
      >
        {socialLinks.map((link) => (
          <IconButton
            key={link.label}
            component="a"
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            size="small"
            sx={{
              border: '2px solid',
              borderColor: 'text.secondary',
              width: 40,
              height: 40,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'text.secondary',
                '& .MuiSvgIcon-root': {
                  color: 'white',
                },
              },
              '& .MuiSvgIcon-root': {
                color: 'text.secondary',
                fontSize: 24,
                transition: 'all 0.2s ease-in-out',
              },
            }}
          >
            {link.icon}
          </IconButton>
        ))}
      </Box>

      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
      >
        © {new Date().getFullYear()} Expense Tracker
      </Typography>
    </Box>
  );
}
