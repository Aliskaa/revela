import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import { BarChartBig, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';

export const SIDEBAR_WIDTH = 260;

export type LayoutSidebarItem = {
    id: string;
    label: string;
    icon: ReactNode;
    active: boolean;
    onClick: () => void;
};

type LayoutSidebarProps = {
    subtitle: string;
    items: LayoutSidebarItem[];
    onLogout: () => void;
};

export const LayoutSidebar = ({ subtitle, items, onLogout }: LayoutSidebarProps) => {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box
                    sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        p: 1.2,
                        borderRadius: 2.5,
                        display: 'flex',
                        boxShadow: '0 4px 12px rgba(21, 21, 176, 0.25)',
                    }}
                >
                    <BarChartBig size={24} strokeWidth={2.5} />
                </Box>
                <Box>
                    <Typography
                        variant="h6"
                        fontWeight={900}
                        color="primary.main"
                        lineHeight={1.1}
                        letterSpacing={-0.5}
                    >
                        AOR CONSEIL
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        textTransform="uppercase"
                        letterSpacing={1}
                    >
                        {subtitle}
                    </Typography>
                </Box>
            </Box>

            <List sx={{ px: 2, gap: 1 }}>
                {items.map(item => (
                    <ListItemButton
                        key={item.id}
                        selected={item.active}
                        onClick={item.onClick}
                        sx={{
                            borderRadius: 2,
                            py: 1.2,
                            px: 2,
                            position: 'relative',
                            color: item.active ? 'primary.main' : 'text.secondary',
                            bgcolor: item.active ? 'rgba(21, 21, 176, 0.06)' : 'transparent',
                            transition: 'all 0.2s ease',
                            '&.Mui-selected': {
                                bgcolor: 'rgba(21, 21, 176, 0.06)',
                                '&:hover': { bgcolor: 'rgba(21, 21, 176, 0.1)' },
                            },
                            '&:hover': {
                                bgcolor: item.active ? 'rgba(21, 21, 176, 0.1)' : 'rgba(0, 0, 0, 0.03)',
                                color: item.active ? 'primary.main' : 'text.primary',
                            },
                            '&::before': item.active
                                ? {
                                      content: '""',
                                      position: 'absolute',
                                      left: 0,
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      height: '60%',
                                      width: '4px',
                                      bgcolor: 'primary.main',
                                      borderRadius: '0 4px 4px 0',
                                  }
                                : {},
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>{item.icon}</ListItemIcon>
                        <ListItemText
                            primary={item.label}
                            slotProps={{ primary: { fontSize: '0.95rem', fontWeight: item.active ? 700 : 500 } }}
                        />
                    </ListItemButton>
                ))}
            </List>

            <Box sx={{ p: 2, mt: 'auto' }}>
                <Divider sx={{ mb: 1.5 }} />
                <ListItemButton
                    onClick={onLogout}
                    sx={{
                        borderRadius: 2,
                        py: 1.2,
                        px: 2,
                        color: 'text.secondary',
                        transition: 'all 0.2s ease',
                        '&:hover': { color: 'error.main', bgcolor: 'error.lighter' },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                        <LogOut size={22} />
                    </ListItemIcon>
                    <ListItemText primary="Déconnexion" slotProps={{ primary: { fontSize: '0.95rem', fontWeight: 600 } }} />
                </ListItemButton>
            </Box>
        </Box>
    );
};
