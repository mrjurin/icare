/**
 * Page Builder Type Definitions and Registry
 * 
 * This file contains all the type definitions and constants for the dynamic page builder system.
 * It defines the supported block types, page types, and their configurations.
 * 
 * Requirements: 2.1, 6.1, 6.4
 */

import { 
  Layout, 
  Type, 
  Image, 
  Megaphone, 
  Mail, 
  Phone, 
  ChevronDown, 
  BarChart3, 
  Users,
  FileText,
  Grid3X3,
  MapPin,
  Calendar,
  Star,
  MessageSquare,
  Video,
  Link,
  Settings
} from 'lucide-react';

// Core interfaces for the page builder system

export interface EditableField {
  key: string;
  type: 'text' | 'richtext' | 'image' | 'color' | 'number' | 'select' | 'boolean' | 'url' | 'textarea' | 'accordion-items' | 'statistics-items' | 'team-members';
  label: string;
  required?: boolean;
  options?: string[]; // for select type
  placeholder?: string;
  maxLength?: number;
  minLength?: number;
  min?: number; // for number type
  max?: number; // for number type
  description?: string; // help text for the field
}

export interface ContentBlockType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  category: 'layout' | 'content' | 'media' | 'interactive' | 'specialized';
  description: string;
  defaultConfig: Record<string, any>;
  editableFields: EditableField[];
  allowedPageTypes?: string[]; // If specified, only these page types can use this block
  isSystemBlock?: boolean; // System blocks cannot be deleted
  maxInstances?: number; // Maximum instances per page (undefined = unlimited)
}

export interface PageType {
  id: string;
  name: string;
  route: string;
  description: string;
  allowedBlocks: string[]; // Which block types are allowed on this page type
  defaultBlocks: ContentBlockTemplate[]; // Default blocks when creating new page
  seoRequired: boolean; // Whether SEO fields are required
  isSystemPage?: boolean; // System pages cannot be deleted
  category: 'public' | 'legal' | 'functional' | 'custom';
}

export interface ContentBlockTemplate {
  type: string;
  order: number;
  defaultContent?: Record<string, any>;
  configuration?: Record<string, any>;
}

// Block validation interface
export interface BlockValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BlockValidationRule {
  field: string;
  validator: (value: any, config: Record<string, any>) => { isValid: boolean; message?: string };
}

// Content Block Types Registry
// Requirements: 2.1 - Display content block types allowed for each page type

export const BLOCK_TYPES: ContentBlockType[] = [
  // Layout blocks - provide structure and visual hierarchy
  {
    id: 'hero',
    name: 'Hero Section',
    icon: Layout,
    category: 'layout',
    description: 'Large banner section with title, subtitle, and call-to-action buttons',
    defaultConfig: {
      backgroundImage: '',
      overlayOpacity: 0.2,
      alignment: 'center',
      height: 'large',
      showButtons: true
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'Title', required: true, maxLength: 100 },
      { key: 'subtitle', type: 'textarea', label: 'Subtitle', maxLength: 200 },
      { key: 'primaryButton', type: 'text', label: 'Primary Button Text', maxLength: 30 },
      { key: 'primaryButtonUrl', type: 'url', label: 'Primary Button URL' },
      { key: 'secondaryButton', type: 'text', label: 'Secondary Button Text', maxLength: 30 },
      { key: 'secondaryButtonUrl', type: 'url', label: 'Secondary Button URL' },
      { key: 'backgroundImage', type: 'image', label: 'Background Image' },
      { key: 'alignment', type: 'select', label: 'Text Alignment', options: ['left', 'center', 'right'] },
      { key: 'height', type: 'select', label: 'Section Height', options: ['small', 'medium', 'large', 'full'] }
    ],
    maxInstances: 1 // Only one hero per page
  },

  // Content blocks - text and rich content
  {
    id: 'text',
    name: 'Text Block',
    icon: Type,
    category: 'content',
    description: 'Rich text content with formatting options',
    defaultConfig: {
      alignment: 'left',
      maxWidth: 'full',
      showTitle: true
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'Title', maxLength: 100 },
      { key: 'content', type: 'richtext', label: 'Content', required: true },
      { key: 'alignment', type: 'select', label: 'Text Alignment', options: ['left', 'center', 'right'] },
      { key: 'maxWidth', type: 'select', label: 'Content Width', options: ['narrow', 'medium', 'wide', 'full'] }
    ]
  },

  {
    id: 'accordion',
    name: 'Accordion/FAQ',
    icon: ChevronDown,
    category: 'content',
    description: 'Collapsible content sections, perfect for FAQs',
    defaultConfig: {
      allowMultiple: false,
      startExpanded: false
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'Section Title', maxLength: 100 },
      { key: 'items', type: 'accordion-items', label: 'Accordion Items', required: true },
      { key: 'allowMultiple', type: 'boolean', label: 'Allow Multiple Open' },
      { key: 'startExpanded', type: 'boolean', label: 'Start First Item Expanded' }
    ],
    allowedPageTypes: ['about', 'terms', 'privacy', 'contact', 'custom']
  },

  {
    id: 'table',
    name: 'Data Table',
    icon: Grid3X3,
    category: 'content',
    description: 'Structured data in table format',
    defaultConfig: {
      striped: true,
      bordered: true,
      responsive: true
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'Table Title', maxLength: 100 },
      { key: 'headers', type: 'textarea', label: 'Column Headers (comma-separated)', required: true },
      { key: 'data', type: 'textarea', label: 'Table Data (JSON format)', required: true },
      { key: 'striped', type: 'boolean', label: 'Striped Rows' },
      { key: 'bordered', type: 'boolean', label: 'Show Borders' }
    ],
    allowedPageTypes: ['terms', 'privacy', 'custom']
  },

  // Media blocks - images, videos, and visual content
  {
    id: 'image',
    name: 'Image Block',
    icon: Image,
    category: 'media',
    description: 'Single image with optional caption and styling',
    defaultConfig: {
      alignment: 'center',
      showCaption: true,
      rounded: false,
      shadow: false
    },
    editableFields: [
      { key: 'image', type: 'image', label: 'Image', required: true },
      { key: 'alt', type: 'text', label: 'Alt Text', required: true, maxLength: 200 },
      { key: 'caption', type: 'text', label: 'Caption', maxLength: 300 },
      { key: 'alignment', type: 'select', label: 'Image Alignment', options: ['left', 'center', 'right'] },
      { key: 'size', type: 'select', label: 'Image Size', options: ['small', 'medium', 'large', 'full'] },
      { key: 'rounded', type: 'boolean', label: 'Rounded Corners' },
      { key: 'shadow', type: 'boolean', label: 'Drop Shadow' }
    ]
  },

  {
    id: 'video',
    name: 'Video Block',
    icon: Video,
    category: 'media',
    description: 'Embedded video content with controls',
    defaultConfig: {
      autoplay: false,
      controls: true,
      muted: false,
      loop: false
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'Video Title', maxLength: 100 },
      { key: 'videoUrl', type: 'url', label: 'Video URL', required: true },
      { key: 'thumbnail', type: 'image', label: 'Custom Thumbnail' },
      { key: 'description', type: 'textarea', label: 'Video Description', maxLength: 500 },
      { key: 'autoplay', type: 'boolean', label: 'Autoplay' },
      { key: 'controls', type: 'boolean', label: 'Show Controls' },
      { key: 'muted', type: 'boolean', label: 'Start Muted' }
    ]
  },

  // Interactive blocks - forms, dynamic content
  {
    id: 'announcements',
    name: 'Announcements',
    icon: Megaphone,
    category: 'interactive',
    description: 'Dynamic list of latest announcements',
    defaultConfig: {
      limit: 3,
      showViewAll: true,
      showDate: true,
      showExcerpt: true
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'Section Title', maxLength: 100 },
      { key: 'limit', type: 'number', label: 'Number of Announcements', min: 1, max: 10 },
      { key: 'showViewAll', type: 'boolean', label: 'Show "View All" Link' },
      { key: 'showDate', type: 'boolean', label: 'Show Publication Date' },
      { key: 'showExcerpt', type: 'boolean', label: 'Show Excerpt' }
    ],
    allowedPageTypes: ['landing', 'custom'],
    isSystemBlock: true // Connected to dynamic data
  },

  {
    id: 'contact-form',
    name: 'Contact Form',
    icon: Mail,
    category: 'interactive',
    description: 'Contact form with customizable fields',
    defaultConfig: {
      fields: ['name', 'email', 'message'],
      submitText: 'Send Message',
      showLabels: true,
      requireConsent: true
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'Form Title', maxLength: 100 },
      { key: 'description', type: 'textarea', label: 'Form Description', maxLength: 300 },
      { key: 'submitText', type: 'text', label: 'Submit Button Text', maxLength: 30 },
      { key: 'successMessage', type: 'textarea', label: 'Success Message', maxLength: 200 },
      { key: 'requireConsent', type: 'boolean', label: 'Require Privacy Consent' }
    ],
    allowedPageTypes: ['contact', 'custom'],
    maxInstances: 1 // Only one contact form per page
  },

  // Specialized blocks - specific functionality
  {
    id: 'statistics',
    name: 'Statistics',
    icon: BarChart3,
    category: 'specialized',
    description: 'Display key statistics and numbers',
    defaultConfig: {
      columns: 3,
      showIcons: true,
      animateNumbers: true
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'Section Title', maxLength: 100 },
      { key: 'stats', type: 'statistics-items', label: 'Statistics', required: true },
      { key: 'columns', type: 'select', label: 'Columns', options: ['2', '3', '4'] },
      { key: 'showIcons', type: 'boolean', label: 'Show Icons' },
      { key: 'animateNumbers', type: 'boolean', label: 'Animate Numbers' }
    ],
    allowedPageTypes: ['landing', 'about', 'custom']
  },

  {
    id: 'team',
    name: 'Team Members',
    icon: Users,
    category: 'specialized',
    description: 'Display team members with photos and details',
    defaultConfig: {
      columns: 3,
      showSocial: true,
      showBio: true,
      layout: 'grid'
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'Section Title', maxLength: 100 },
      { key: 'members', type: 'team-members', label: 'Team Members', required: true },
      { key: 'columns', type: 'select', label: 'Columns', options: ['2', '3', '4'] },
      { key: 'layout', type: 'select', label: 'Layout Style', options: ['grid', 'list', 'carousel'] },
      { key: 'showSocial', type: 'boolean', label: 'Show Social Links' },
      { key: 'showBio', type: 'boolean', label: 'Show Biography' }
    ],
    allowedPageTypes: ['about', 'custom']
  },

  {
    id: 'contact-info',
    name: 'Contact Information',
    icon: Phone,
    category: 'specialized',
    description: 'Display contact details and office information',
    defaultConfig: {
      showMap: false,
      layout: 'vertical',
      showIcons: true
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'Section Title', maxLength: 100 },
      { key: 'address', type: 'textarea', label: 'Address', maxLength: 300 },
      { key: 'phone', type: 'text', label: 'Phone Number', maxLength: 20 },
      { key: 'email', type: 'text', label: 'Email Address', maxLength: 100 },
      { key: 'hours', type: 'textarea', label: 'Operating Hours', maxLength: 200 },
      { key: 'website', type: 'url', label: 'Website URL' },
      { key: 'layout', type: 'select', label: 'Layout', options: ['vertical', 'horizontal', 'cards'] },
      { key: 'showIcons', type: 'boolean', label: 'Show Icons' }
    ],
    allowedPageTypes: ['contact', 'custom']
  },

  {
    id: 'map',
    name: 'Location Map',
    icon: MapPin,
    category: 'specialized',
    description: 'Interactive map showing location',
    defaultConfig: {
      zoom: 15,
      showMarker: true,
      height: 'medium'
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'Map Title', maxLength: 100 },
      { key: 'address', type: 'textarea', label: 'Address', required: true, maxLength: 300 },
      { key: 'latitude', type: 'number', label: 'Latitude' },
      { key: 'longitude', type: 'number', label: 'Longitude' },
      { key: 'zoom', type: 'number', label: 'Zoom Level', min: 1, max: 20 },
      { key: 'height', type: 'select', label: 'Map Height', options: ['small', 'medium', 'large'] },
      { key: 'showMarker', type: 'boolean', label: 'Show Location Marker' }
    ],
    allowedPageTypes: ['contact', 'custom']
  },

  {
    id: 'features',
    name: 'Features Grid',
    icon: Star,
    category: 'specialized',
    description: 'Highlight key features or services',
    defaultConfig: {
      columns: 3,
      showIcons: true,
      layout: 'grid'
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'Section Title', maxLength: 100 },
      { key: 'subtitle', type: 'textarea', label: 'Section Subtitle', maxLength: 200 },
      { key: 'features', type: 'accordion-items', label: 'Features', required: true }, // Reuse accordion-items for simplicity
      { key: 'columns', type: 'select', label: 'Columns', options: ['2', '3', '4'] },
      { key: 'layout', type: 'select', label: 'Layout Style', options: ['grid', 'list'] },
      { key: 'showIcons', type: 'boolean', label: 'Show Icons' }
    ],
    allowedPageTypes: ['landing', 'about', 'custom']
  },

  {
    id: 'cta',
    name: 'Call to Action',
    icon: MessageSquare,
    category: 'specialized',
    description: 'Prominent call-to-action section',
    defaultConfig: {
      style: 'primary',
      size: 'large',
      centered: true
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'CTA Title', required: true, maxLength: 100 },
      { key: 'description', type: 'textarea', label: 'Description', maxLength: 300 },
      { key: 'buttonText', type: 'text', label: 'Button Text', required: true, maxLength: 30 },
      { key: 'buttonUrl', type: 'url', label: 'Button URL', required: true },
      { key: 'style', type: 'select', label: 'Style', options: ['primary', 'secondary', 'outline'] },
      { key: 'size', type: 'select', label: 'Size', options: ['small', 'medium', 'large'] },
      { key: 'centered', type: 'boolean', label: 'Center Align' }
    ],
    allowedPageTypes: ['landing', 'about', 'custom']
  },

  {
    id: 'timeline',
    name: 'Timeline',
    icon: Calendar,
    category: 'specialized',
    description: 'Display events or milestones in chronological order',
    defaultConfig: {
      orientation: 'vertical',
      showDates: true,
      alternating: false
    },
    editableFields: [
      { key: 'title', type: 'text', label: 'Timeline Title', maxLength: 100 },
      { key: 'events', type: 'accordion-items', label: 'Timeline Events', required: true }, // Reuse for simplicity
      { key: 'orientation', type: 'select', label: 'Orientation', options: ['vertical', 'horizontal'] },
      { key: 'showDates', type: 'boolean', label: 'Show Dates' },
      { key: 'alternating', type: 'boolean', label: 'Alternating Layout' }
    ],
    allowedPageTypes: ['about', 'custom']
  }
];

// Page Types Registry
// Requirements: 6.1 - Create PAGE_TYPES constant with page-specific configurations

export const PAGE_TYPES: PageType[] = [
  {
    id: 'landing',
    name: 'Landing Page',
    route: '/',
    description: 'Main homepage that visitors see first',
    allowedBlocks: ['hero', 'text', 'announcements', 'statistics', 'features', 'cta', 'image', 'video'],
    defaultBlocks: [
      { type: 'hero', order: 1, defaultContent: { title: 'Welcome to Our Platform' } },
      { type: 'announcements', order: 2 },
      { type: 'features', order: 3 },
      { type: 'cta', order: 4, defaultContent: { title: 'Get Started Today' } }
    ],
    seoRequired: true,
    isSystemPage: true,
    category: 'public'
  },
  {
    id: 'about',
    name: 'About Us',
    route: '/about',
    description: 'Information about the organization',
    allowedBlocks: ['hero', 'text', 'image', 'team', 'timeline', 'statistics', 'video', 'accordion'],
    defaultBlocks: [
      { type: 'hero', order: 1, defaultContent: { title: 'About Us' } },
      { type: 'text', order: 2, defaultContent: { title: 'Our Story' } }
    ],
    seoRequired: true,
    isSystemPage: true,
    category: 'public'
  },
  {
    id: 'privacy',
    name: 'Privacy Policy',
    route: '/privacy-policy',
    description: 'Privacy policy and data handling information',
    allowedBlocks: ['text', 'accordion', 'table'],
    defaultBlocks: [
      { type: 'text', order: 1, defaultContent: { title: 'Privacy Policy' } }
    ],
    seoRequired: false,
    isSystemPage: true,
    category: 'legal'
  },
  {
    id: 'terms',
    name: 'Terms of Service',
    route: '/terms-of-service',
    description: 'Terms and conditions of service',
    allowedBlocks: ['text', 'accordion', 'table'],
    defaultBlocks: [
      { type: 'text', order: 1, defaultContent: { title: 'Terms of Service' } }
    ],
    seoRequired: false,
    isSystemPage: true,
    category: 'legal'
  },
  {
    id: 'contact',
    name: 'Contact Us',
    route: '/contact',
    description: 'Contact information and forms',
    allowedBlocks: ['hero', 'text', 'contact-form', 'map', 'contact-info', 'image'],
    defaultBlocks: [
      { type: 'hero', order: 1, defaultContent: { title: 'Contact Us' } },
      { type: 'contact-form', order: 2 },
      { type: 'contact-info', order: 3 }
    ],
    seoRequired: true,
    isSystemPage: true,
    category: 'functional'
  },
  {
    id: 'custom',
    name: 'Custom Page',
    route: '/custom',
    description: 'Custom page with flexible content',
    allowedBlocks: [
      'hero', 'text', 'image', 'video', 'accordion', 'table', 'announcements', 
      'contact-form', 'statistics', 'team', 'contact-info', 'map', 'features', 
      'cta', 'timeline'
    ],
    defaultBlocks: [
      { type: 'text', order: 1, defaultContent: { title: 'Custom Page' } }
    ],
    seoRequired: true,
    isSystemPage: false,
    category: 'custom'
  }
];

// Block validation functions
// Requirements: 6.4 - Implement block validation logic

export class BlockValidator {
  /**
   * Validate a content block configuration
   */
  static validateBlock(
    blockType: string, 
    configuration: Record<string, any>, 
    content: Record<string, any>
  ): BlockValidationResult {
    const result: BlockValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    const blockTypeDef = BLOCK_TYPES.find(bt => bt.id === blockType);
    if (!blockTypeDef) {
      result.isValid = false;
      result.errors.push(`Unknown block type: ${blockType}`);
      return result;
    }

    // Validate required fields
    for (const field of blockTypeDef.editableFields) {
      if (field.required) {
        const value = content[field.key];
        if (value === undefined || value === null || value === '') {
          result.isValid = false;
          result.errors.push(`Required field '${field.label}' is missing`);
        }
      }

      // Validate field-specific constraints
      const value = content[field.key];
      if (value !== undefined && value !== null && value !== '') {
        const fieldValidation = this.validateField(field, value);
        if (!fieldValidation.isValid) {
          result.isValid = false;
          result.errors.push(`Field '${field.label}': ${fieldValidation.message}`);
        }
      }
    }

    // Block-specific validations
    const blockValidation = this.validateBlockSpecific(blockType, configuration, content);
    result.errors.push(...blockValidation.errors);
    result.warnings.push(...blockValidation.warnings);
    
    if (blockValidation.errors.length > 0) {
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate individual field values
   */
  private static validateField(field: EditableField, value: any): { isValid: boolean; message?: string } {
    switch (field.type) {
      case 'text':
        if (typeof value !== 'string') {
          return { isValid: false, message: 'Must be a text value' };
        }
        if (field.maxLength && value.length > field.maxLength) {
          return { isValid: false, message: `Must be ${field.maxLength} characters or less` };
        }
        if (field.minLength && value.length < field.minLength) {
          return { isValid: false, message: `Must be at least ${field.minLength} characters` };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { isValid: false, message: 'Must be a valid number' };
        }
        if (field.min !== undefined && value < field.min) {
          return { isValid: false, message: `Must be at least ${field.min}` };
        }
        if (field.max !== undefined && value > field.max) {
          return { isValid: false, message: `Must be at most ${field.max}` };
        }
        break;

      case 'url':
        if (typeof value !== 'string') {
          return { isValid: false, message: 'Must be a text value' };
        }
        try {
          new URL(value);
        } catch {
          return { isValid: false, message: 'Must be a valid URL' };
        }
        break;

      case 'select':
        if (field.options && !field.options.includes(value)) {
          return { isValid: false, message: `Must be one of: ${field.options.join(', ')}` };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return { isValid: false, message: 'Must be true or false' };
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * Block-specific validation rules
   */
  private static validateBlockSpecific(
    blockType: string, 
    configuration: Record<string, any>, 
    content: Record<string, any>
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (blockType) {
      case 'hero':
        if (!content.primaryButton && !content.secondaryButton) {
          warnings.push('Hero section has no call-to-action buttons');
        }
        if (content.primaryButton && !content.primaryButtonUrl) {
          errors.push('Primary button requires a URL');
        }
        if (content.secondaryButton && !content.secondaryButtonUrl) {
          errors.push('Secondary button requires a URL');
        }
        break;

      case 'contact-form':
        if (!content.submitText) {
          warnings.push('Contact form should have submit button text');
        }
        break;

      case 'statistics':
        if (content.stats && Array.isArray(content.stats)) {
          if (content.stats.length === 0) {
            errors.push('Statistics block must have at least one statistic');
          }
          for (const stat of content.stats) {
            if (!stat.value || !stat.label) {
              errors.push('Each statistic must have both a value and label');
            }
          }
        }
        break;

      case 'team':
        if (content.members && Array.isArray(content.members)) {
          if (content.members.length === 0) {
            errors.push('Team block must have at least one team member');
          }
          for (const member of content.members) {
            if (!member.name) {
              errors.push('Each team member must have a name');
            }
          }
        }
        break;

      case 'map':
        if (!content.address && (!content.latitude || !content.longitude)) {
          errors.push('Map block requires either an address or latitude/longitude coordinates');
        }
        break;
    }

    return { errors, warnings };
  }

  /**
   * Validate if a block type is allowed on a specific page type
   */
  static isBlockAllowedOnPage(blockTypeId: string, pageTypeId: string): boolean {
    const pageType = PAGE_TYPES.find(pt => pt.id === pageTypeId);
    if (!pageType) {
      return false;
    }

    const blockType = BLOCK_TYPES.find(bt => bt.id === blockTypeId);
    if (!blockType) {
      return false;
    }

    // If block has specific page type restrictions, check them
    if (blockType.allowedPageTypes && blockType.allowedPageTypes.length > 0) {
      return blockType.allowedPageTypes.includes(pageTypeId);
    }

    // Otherwise, check if page type allows this block
    return pageType.allowedBlocks.includes(blockTypeId);
  }

  /**
   * Get allowed block types for a specific page type
   */
  static getAllowedBlockTypes(pageTypeId: string): ContentBlockType[] {
    const pageType = PAGE_TYPES.find(pt => pt.id === pageTypeId);
    if (!pageType) {
      return [];
    }

    return BLOCK_TYPES.filter(blockType => {
      // If block has specific page type restrictions, check them
      if (blockType.allowedPageTypes && blockType.allowedPageTypes.length > 0) {
        return blockType.allowedPageTypes.includes(pageTypeId);
      }
      
      // Otherwise, check if page type allows this block
      return pageType.allowedBlocks.includes(blockType.id);
    });
  }

  /**
   * Check if a page can have more instances of a specific block type
   */
  static canAddMoreBlocks(
    blockTypeId: string, 
    currentBlockCount: number
  ): { canAdd: boolean; reason?: string } {
    const blockType = BLOCK_TYPES.find(bt => bt.id === blockTypeId);
    if (!blockType) {
      return { canAdd: false, reason: 'Unknown block type' };
    }

    if (blockType.maxInstances && currentBlockCount >= blockType.maxInstances) {
      return { 
        canAdd: false, 
        reason: `Maximum ${blockType.maxInstances} instance(s) of ${blockType.name} allowed per page` 
      };
    }

    return { canAdd: true };
  }
}

// Utility functions for working with block types and page types

/**
 * Get a block type definition by ID
 */
export function getBlockType(blockTypeId: string): ContentBlockType | undefined {
  return BLOCK_TYPES.find(bt => bt.id === blockTypeId);
}

/**
 * Get a page type definition by ID
 */
export function getPageType(pageTypeId: string): PageType | undefined {
  return PAGE_TYPES.find(pt => pt.id === pageTypeId);
}

/**
 * Get block types by category
 */
export function getBlockTypesByCategory(category: ContentBlockType['category']): ContentBlockType[] {
  return BLOCK_TYPES.filter(bt => bt.category === category);
}

/**
 * Get page types by category
 */
export function getPageTypesByCategory(category: PageType['category']): PageType[] {
  return PAGE_TYPES.filter(pt => pt.category === category);
}

/**
 * Create default content for a block type
 */
export function createDefaultBlockContent(blockTypeId: string, pageTypeId?: string): Record<string, any> {
  const blockType = getBlockType(blockTypeId);
  if (!blockType) {
    return {};
  }

  const defaultContent: Record<string, any> = {};

  // Set default values based on field definitions
  for (const field of blockType.editableFields) {
    if (field.type === 'boolean') {
      defaultContent[field.key] = false;
    } else if (field.type === 'number') {
      defaultContent[field.key] = field.min || 0;
    } else if (field.type === 'select' && field.options && field.options.length > 0) {
      defaultContent[field.key] = field.options[0];
    } else {
      defaultContent[field.key] = '';
    }
  }

  // Apply block type default configuration
  Object.assign(defaultContent, blockType.defaultConfig);

  // Apply page-specific defaults if available
  if (pageTypeId) {
    const pageType = getPageType(pageTypeId);
    if (pageType) {
      const defaultBlock = pageType.defaultBlocks.find(db => db.type === blockTypeId);
      if (defaultBlock && defaultBlock.defaultContent) {
        Object.assign(defaultContent, defaultBlock.defaultContent);
      }
    }
  }

  return defaultContent;
}

/**
 * Generate a unique block key for a page
 */
export function generateBlockKey(blockTypeId: string, existingKeys: string[]): string {
  let counter = 1;
  let key = `${blockTypeId}_${counter}`;
  
  while (existingKeys.includes(key)) {
    counter++;
    key = `${blockTypeId}_${counter}`;
  }
  
  return key;
}