import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CodeIcon from '@mui/icons-material/Code';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const FOOTER_LINKS = [
  {
    key: 'linkedin',
    href: 'https://www.linkedin.com/in/erick-boyzo-258023a1/',
    icon: <LinkedInIcon />,
    label: 'LinkedIn',
  },
  {
    key: 'github',
    href: 'https://github.com/erickboyzo',
    icon: <GitHubIcon />,
    label: 'GitHub',
  },
  {
    key: 'sourceCode',
    href: 'https://github.com/erickboyzo/expense-tracker',
    icon: <CodeIcon />,
    label: 'Source Code',
  },
] as const;

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        justifyContent: 'center',
        py: 2,
      }}
    >
      {FOOTER_LINKS.map((link) => (
        <IconButton
          key={link.key}
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
  );
}
