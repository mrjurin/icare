/**
 * Block Template System
 * 
 * This file contains default templates for each block type and template management functionality.
 * Templates provide pre-configured content and styling options for content blocks.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { ContentBlockType, BLOCK_TYPES } from '../types/page-builder';

// Template interfaces

export interface BlockTemplate {
  id: string;
  name: string;
  description: string;
  blockType: string;
  preview?: string; // URL to preview image or base64 data
  category: 'basic' | 'professional' | 'creative' | 'minimal';
  isPremium?: boolean;
  configuration: Record<string, any>;
  content: Record<string, any>;
  styling?: {
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    padding?: string;
    margin?: string;
    customCSS?: string;
  };
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

// Template categories for organization
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Simple, clean templates for everyday use',
    icon: '📄'
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Polished templates for business use',
    icon: '💼'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Eye-catching templates with unique designs',
    icon: '🎨'
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, minimalist templates',
    icon: '⚪'
  }
];

// Default templates for each block type
// Requirements: 6.1 - Create default templates for each block type

export const BLOCK_TEMPLATES: BlockTemplate[] = [
  // Hero Section Templates
  {
    id: 'hero_basic',
    name: 'Basic Hero',
    description: 'Simple hero section with title and subtitle',
    blockType: 'hero',
    category: 'basic',
    configuration: {
      backgroundImage: '',
      overlayOpacity: 0.2,
      alignment: 'center',
      height: 'large',
      showButtons: true
    },
    content: {
      title: 'Welcome to Our Platform',
      subtitle: 'Discover amazing features and services that will transform your experience',
      primaryButton: 'Get Started',
      primaryButtonUrl: '#',
      secondaryButton: 'Learn More',
      secondaryButtonUrl: '#about'
    },
    styling: {
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      padding: '4rem 0'
    }
  },
  {
    id: 'hero_professional',
    name: 'Professional Hero',
    description: 'Corporate-style hero with strong call-to-action',
    blockType: 'hero',
    category: 'professional',
    configuration: {
      backgroundImage: '',
      overlayOpacity: 0.4,
      alignment: 'left',
      height: 'large',
      showButtons: true
    },
    content: {
      title: 'Empowering Your Success',
      subtitle: 'Professional solutions designed to help you achieve your goals with confidence and efficiency',
      primaryButton: 'Start Your Journey',
      primaryButtonUrl: '#contact',
      secondaryButton: 'View Services',
      secondaryButtonUrl: '#services'
    },
    styling: {
      backgroundColor: '#1e40af',
      textColor: '#ffffff',
      padding: '5rem 0'
    }
  },
  {
    id: 'hero_creative',
    name: 'Creative Hero',
    description: 'Vibrant hero section with creative elements',
    blockType: 'hero',
    category: 'creative',
    configuration: {
      backgroundImage: '',
      overlayOpacity: 0.3,
      alignment: 'center',
      height: 'full',
      showButtons: true
    },
    content: {
      title: 'Unleash Your Creativity',
      subtitle: 'Join thousands of creators who are building amazing things with our innovative platform',
      primaryButton: 'Create Now',
      primaryButtonUrl: '#create',
      secondaryButton: 'Explore Gallery',
      secondaryButtonUrl: '#gallery'
    },
    styling: {
      backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textColor: '#ffffff',
      padding: '6rem 0'
    }
  },
  {
    id: 'hero_minimal',
    name: 'Minimal Hero',
    description: 'Clean, minimal hero with focus on content',
    blockType: 'hero',
    category: 'minimal',
    configuration: {
      backgroundImage: '',
      overlayOpacity: 0,
      alignment: 'center',
      height: 'medium',
      showButtons: false
    },
    content: {
      title: 'Simple. Effective. Powerful.',
      subtitle: 'Everything you need, nothing you don\'t',
      primaryButton: '',
      primaryButtonUrl: '',
      secondaryButton: '',
      secondaryButtonUrl: ''
    },
    styling: {
      backgroundColor: '#ffffff',
      textColor: '#374151',
      padding: '3rem 0'
    }
  },

  // Text Block Templates
  {
    id: 'text_basic',
    name: 'Basic Text',
    description: 'Standard text block with title and content',
    blockType: 'text',
    category: 'basic',
    configuration: {
      alignment: 'left',
      maxWidth: 'full',
      showTitle: true
    },
    content: {
      title: 'About Our Services',
      content: '<p>We provide comprehensive solutions tailored to meet your specific needs. Our team of experts is dedicated to delivering exceptional results that exceed your expectations.</p><p>With years of experience in the industry, we understand the challenges you face and are here to help you overcome them with innovative approaches and proven strategies.</p>'
    },
    styling: {
      padding: '2rem 0'
    }
  },
  {
    id: 'text_professional',
    name: 'Professional Text',
    description: 'Business-focused text with structured content',
    blockType: 'text',
    category: 'professional',
    configuration: {
      alignment: 'left',
      maxWidth: 'wide',
      showTitle: true
    },
    content: {
      title: 'Our Commitment to Excellence',
      content: '<h3>Industry Leadership</h3><p>As a leading provider in our field, we maintain the highest standards of quality and professionalism in everything we do.</p><h3>Client-Focused Approach</h3><p>We prioritize our clients\' success and work collaboratively to achieve their objectives through tailored solutions and ongoing support.</p><h3>Innovation & Growth</h3><p>We continuously invest in new technologies and methodologies to ensure our clients stay ahead of the competition.</p>'
    },
    styling: {
      backgroundColor: '#f9fafb',
      padding: '3rem 0'
    }
  },
  {
    id: 'text_minimal',
    name: 'Minimal Text',
    description: 'Clean text block with minimal styling',
    blockType: 'text',
    category: 'minimal',
    configuration: {
      alignment: 'center',
      maxWidth: 'narrow',
      showTitle: false
    },
    content: {
      title: '',
      content: '<p class="text-lg">Simple, clear communication is at the heart of everything we do. We believe in the power of well-crafted words to inspire, inform, and connect.</p>'
    },
    styling: {
      padding: '2rem 0',
      textColor: '#6b7280'
    }
  },

  // Features Block Templates
  {
    id: 'features_basic',
    name: 'Basic Features',
    description: 'Simple features grid with icons',
    blockType: 'features',
    category: 'basic',
    configuration: {
      columns: 3,
      showIcons: true,
      layout: 'grid'
    },
    content: {
      title: 'Key Features',
      subtitle: 'Everything you need to succeed',
      features: [
        {
          title: 'Easy to Use',
          description: 'Intuitive interface designed for users of all skill levels',
          icon: '🚀'
        },
        {
          title: 'Secure & Reliable',
          description: 'Enterprise-grade security with 99.9% uptime guarantee',
          icon: '🔒'
        },
        {
          title: '24/7 Support',
          description: 'Round-the-clock customer support whenever you need help',
          icon: '💬'
        }
      ]
    },
    styling: {
      padding: '3rem 0'
    }
  },
  {
    id: 'features_professional',
    name: 'Professional Features',
    description: 'Business-focused features with detailed descriptions',
    blockType: 'features',
    category: 'professional',
    configuration: {
      columns: 2,
      showIcons: true,
      layout: 'grid'
    },
    content: {
      title: 'Enterprise Solutions',
      subtitle: 'Comprehensive tools for modern businesses',
      features: [
        {
          title: 'Advanced Analytics',
          description: 'Gain deep insights into your business performance with comprehensive reporting and real-time dashboards',
          icon: '📊'
        },
        {
          title: 'Scalable Infrastructure',
          description: 'Built to grow with your business, from startup to enterprise scale with automatic scaling capabilities',
          icon: '⚡'
        },
        {
          title: 'API Integration',
          description: 'Seamlessly connect with your existing tools and workflows through our robust API ecosystem',
          icon: '🔗'
        },
        {
          title: 'Compliance Ready',
          description: 'Meet industry standards and regulations with built-in compliance features and audit trails',
          icon: '✅'
        }
      ]
    },
    styling: {
      backgroundColor: '#f8fafc',
      padding: '4rem 0'
    }
  },

  // Statistics Block Templates
  {
    id: 'statistics_basic',
    name: 'Basic Statistics',
    description: 'Simple statistics display',
    blockType: 'statistics',
    category: 'basic',
    configuration: {
      columns: 3,
      showIcons: false,
      animateNumbers: true
    },
    content: {
      title: 'Our Impact',
      stats: [
        {
          value: '10,000+',
          label: 'Happy Customers',
          icon: '👥'
        },
        {
          value: '99.9%',
          label: 'Uptime',
          icon: '⚡'
        },
        {
          value: '24/7',
          label: 'Support',
          icon: '🛟'
        }
      ]
    },
    styling: {
      padding: '3rem 0'
    }
  },
  {
    id: 'statistics_professional',
    name: 'Professional Statistics',
    description: 'Business metrics with detailed context',
    blockType: 'statistics',
    category: 'professional',
    configuration: {
      columns: 4,
      showIcons: true,
      animateNumbers: true
    },
    content: {
      title: 'Proven Results',
      stats: [
        {
          value: '500+',
          label: 'Enterprise Clients',
          icon: '🏢'
        },
        {
          value: '$2.5M',
          label: 'Revenue Generated',
          icon: '💰'
        },
        {
          value: '150+',
          label: 'Countries Served',
          icon: '🌍'
        },
        {
          value: '98%',
          label: 'Client Satisfaction',
          icon: '⭐'
        }
      ]
    },
    styling: {
      backgroundColor: '#1e40af',
      textColor: '#ffffff',
      padding: '4rem 0'
    }
  },

  // Contact Form Templates
  {
    id: 'contact_basic',
    name: 'Basic Contact Form',
    description: 'Simple contact form with essential fields',
    blockType: 'contact-form',
    category: 'basic',
    configuration: {
      fields: ['name', 'email', 'message'],
      submitText: 'Send Message',
      showLabels: true,
      requireConsent: true
    },
    content: {
      title: 'Get in Touch',
      description: 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
      submitText: 'Send Message',
      successMessage: 'Thank you for your message! We\'ll get back to you soon.'
    },
    styling: {
      padding: '3rem 0'
    }
  },
  {
    id: 'contact_professional',
    name: 'Professional Contact Form',
    description: 'Comprehensive contact form for business inquiries',
    blockType: 'contact-form',
    category: 'professional',
    configuration: {
      fields: ['name', 'email', 'company', 'phone', 'subject', 'message'],
      submitText: 'Submit Inquiry',
      showLabels: true,
      requireConsent: true
    },
    content: {
      title: 'Business Inquiries',
      description: 'Ready to discuss your project? Fill out the form below and our team will contact you within 24 hours.',
      submitText: 'Submit Inquiry',
      successMessage: 'Your inquiry has been received. A member of our team will contact you within 24 hours.'
    },
    styling: {
      backgroundColor: '#f9fafb',
      padding: '4rem 0'
    }
  },

  // Team Block Templates
  {
    id: 'team_basic',
    name: 'Basic Team',
    description: 'Simple team member grid',
    blockType: 'team',
    category: 'basic',
    configuration: {
      columns: 3,
      showSocial: false,
      showBio: true,
      layout: 'grid'
    },
    content: {
      title: 'Meet Our Team',
      members: [
        {
          name: 'John Smith',
          role: 'CEO & Founder',
          bio: 'Passionate leader with 15+ years of industry experience',
          image: '',
          email: 'john@company.com'
        },
        {
          name: 'Sarah Johnson',
          role: 'Head of Operations',
          bio: 'Operations expert focused on efficiency and growth',
          image: '',
          email: 'sarah@company.com'
        },
        {
          name: 'Mike Chen',
          role: 'Lead Developer',
          bio: 'Full-stack developer with expertise in modern technologies',
          image: '',
          email: 'mike@company.com'
        }
      ]
    },
    styling: {
      padding: '3rem 0'
    }
  },

  // Call-to-Action Templates
  {
    id: 'cta_basic',
    name: 'Basic CTA',
    description: 'Simple call-to-action section',
    blockType: 'cta',
    category: 'basic',
    configuration: {
      style: 'primary',
      size: 'large',
      centered: true
    },
    content: {
      title: 'Ready to Get Started?',
      description: 'Join thousands of satisfied customers who have transformed their business with our solutions.',
      buttonText: 'Get Started Today',
      buttonUrl: '#contact'
    },
    styling: {
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      padding: '4rem 0'
    }
  },
  {
    id: 'cta_professional',
    name: 'Professional CTA',
    description: 'Business-focused call-to-action with urgency',
    blockType: 'cta',
    category: 'professional',
    configuration: {
      style: 'primary',
      size: 'large',
      centered: true
    },
    content: {
      title: 'Transform Your Business Today',
      description: 'Don\'t let your competitors get ahead. Schedule a consultation with our experts and discover how we can help you achieve your goals.',
      buttonText: 'Schedule Consultation',
      buttonUrl: '#consultation'
    },
    styling: {
      backgroundColor: '#1e40af',
      textColor: '#ffffff',
      padding: '5rem 0'
    }
  },

  // Accordion/FAQ Templates
  {
    id: 'accordion_basic',
    name: 'Basic FAQ',
    description: 'Simple frequently asked questions',
    blockType: 'accordion',
    category: 'basic',
    configuration: {
      allowMultiple: false,
      startExpanded: false
    },
    content: {
      title: 'Frequently Asked Questions',
      items: [
        {
          title: 'How do I get started?',
          content: 'Getting started is easy! Simply sign up for an account and follow our step-by-step onboarding process.'
        },
        {
          title: 'What payment methods do you accept?',
          content: 'We accept all major credit cards, PayPal, and bank transfers for enterprise customers.'
        },
        {
          title: 'Is there a free trial available?',
          content: 'Yes, we offer a 14-day free trial with full access to all features. No credit card required.'
        },
        {
          title: 'How can I contact support?',
          content: 'You can reach our support team 24/7 through live chat, email, or phone. We typically respond within 2 hours.'
        }
      ]
    },
    styling: {
      padding: '3rem 0'
    }
  }
];

// Template management functions
// Requirements: 6.2 - Add template selection and customization logic

export class TemplateManager {
  /**
   * Get all templates for a specific block type
   */
  static getTemplatesForBlockType(blockType: string): BlockTemplate[] {
    return BLOCK_TEMPLATES.filter(template => template.blockType === blockType);
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: BlockTemplate['category']): BlockTemplate[] {
    return BLOCK_TEMPLATES.filter(template => template.category === category);
  }

  /**
   * Get a specific template by ID
   */
  static getTemplate(templateId: string): BlockTemplate | undefined {
    return BLOCK_TEMPLATES.find(template => template.id === templateId);
  }

  /**
   * Apply a template to create block content and configuration
   */
  static applyTemplate(templateId: string): {
    configuration: Record<string, any>;
    content: Record<string, any>;
    styling?: Record<string, any>;
  } | null {
    const template = this.getTemplate(templateId);
    if (!template) {
      return null;
    }

    return {
      configuration: { ...template.configuration },
      content: { ...template.content },
      styling: template.styling ? { ...template.styling } : undefined
    };
  }

  /**
   * Customize a template with user modifications
   * Requirements: 6.3 - Preserve base template structure while allowing modifications
   */
  static customizeTemplate(
    templateId: string,
    customizations: {
      configuration?: Partial<Record<string, any>>;
      content?: Partial<Record<string, any>>;
      styling?: Partial<Record<string, any>>;
    }
  ): {
    configuration: Record<string, any>;
    content: Record<string, any>;
    styling?: Record<string, any>;
  } | null {
    const baseTemplate = this.applyTemplate(templateId);
    if (!baseTemplate) {
      return null;
    }

    // Merge customizations with base template while preserving structure
    const customized = {
      configuration: {
        ...baseTemplate.configuration,
        ...customizations.configuration
      },
      content: {
        ...baseTemplate.content,
        ...customizations.content
      },
      styling: baseTemplate.styling || customizations.styling ? {
        ...baseTemplate.styling,
        ...customizations.styling
      } : undefined
    };

    return customized;
  }

  /**
   * Validate template compatibility with block type
   */
  static isTemplateCompatible(templateId: string, blockType: string): boolean {
    const template = this.getTemplate(templateId);
    if (!template) {
      return false;
    }

    return template.blockType === blockType;
  }

  /**
   * Get default template for a block type
   */
  static getDefaultTemplate(blockType: string): BlockTemplate | undefined {
    const templates = this.getTemplatesForBlockType(blockType);
    
    // Return the first basic template, or the first template if no basic template exists
    return templates.find(t => t.category === 'basic') || templates[0];
  }

  /**
   * Create a custom template from existing block configuration
   */
  static createCustomTemplate(
    blockType: string,
    name: string,
    description: string,
    configuration: Record<string, any>,
    content: Record<string, any>,
    styling?: Record<string, any>
  ): BlockTemplate {
    const customTemplate: BlockTemplate = {
      id: `custom_${blockType}_${Date.now()}`,
      name,
      description,
      blockType,
      category: 'basic', // Custom templates default to basic category
      configuration: { ...configuration },
      content: { ...content },
      styling: styling ? { ...styling } : undefined
    };

    return customTemplate;
  }

  /**
   * Get template preview data for UI display
   */
  static getTemplatePreview(templateId: string): {
    id: string;
    name: string;
    description: string;
    category: string;
    blockType: string;
    preview?: string;
  } | null {
    const template = this.getTemplate(templateId);
    if (!template) {
      return null;
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      blockType: template.blockType,
      preview: template.preview
    };
  }

  /**
   * Search templates by name or description
   */
  static searchTemplates(query: string, blockType?: string): BlockTemplate[] {
    const searchTerm = query.toLowerCase();
    let templates = BLOCK_TEMPLATES;

    if (blockType) {
      templates = templates.filter(t => t.blockType === blockType);
    }

    return templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get template statistics for analytics
   */
  static getTemplateStats(): {
    totalTemplates: number;
    templatesByBlockType: Record<string, number>;
    templatesByCategory: Record<string, number>;
  } {
    const stats = {
      totalTemplates: BLOCK_TEMPLATES.length,
      templatesByBlockType: {} as Record<string, number>,
      templatesByCategory: {} as Record<string, number>
    };

    BLOCK_TEMPLATES.forEach(template => {
      // Count by block type
      stats.templatesByBlockType[template.blockType] = 
        (stats.templatesByBlockType[template.blockType] || 0) + 1;

      // Count by category
      stats.templatesByCategory[template.category] = 
        (stats.templatesByCategory[template.category] || 0) + 1;
    });

    return stats;
  }
}

// Template validation functions
// Requirements: 6.4 - Template validation and structure preservation

export class TemplateValidator {
  /**
   * Validate template structure and content
   */
  static validateTemplate(template: BlockTemplate): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    // Check required fields
    if (!template.id) {
      result.errors.push('Template ID is required');
      result.isValid = false;
    }

    if (!template.name) {
      result.errors.push('Template name is required');
      result.isValid = false;
    }

    if (!template.blockType) {
      result.errors.push('Template block type is required');
      result.isValid = false;
    }

    // Validate block type exists
    const blockType = BLOCK_TYPES.find(bt => bt.id === template.blockType);
    if (!blockType) {
      result.errors.push(`Unknown block type: ${template.blockType}`);
      result.isValid = false;
    }

    // Validate configuration against block type requirements
    if (blockType && template.configuration) {
      const configValidation = this.validateTemplateConfiguration(
        template.configuration,
        blockType
      );
      result.errors.push(...configValidation.errors);
      result.warnings.push(...configValidation.warnings);
      
      if (configValidation.errors.length > 0) {
        result.isValid = false;
      }
    }

    // Validate content structure
    if (blockType && template.content) {
      const contentValidation = this.validateTemplateContent(
        template.content,
        blockType
      );
      result.errors.push(...contentValidation.errors);
      result.warnings.push(...contentValidation.warnings);
      
      if (contentValidation.errors.length > 0) {
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Validate template configuration against block type
   */
  private static validateTemplateConfiguration(
    configuration: Record<string, any>,
    blockType: ContentBlockType
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if configuration contains valid fields for the block type
    const validConfigFields = new Set([
      ...blockType.editableFields.map(f => f.key),
      ...Object.keys(blockType.defaultConfig)
    ]);

    for (const key of Object.keys(configuration)) {
      if (!validConfigFields.has(key)) {
        warnings.push(`Configuration field '${key}' is not recognized for block type '${blockType.id}'`);
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate template content against block type
   */
  private static validateTemplateContent(
    content: Record<string, any>,
    blockType: ContentBlockType
  ): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    const requiredFields = blockType.editableFields.filter(f => f.required);
    for (const field of requiredFields) {
      if (!(field.key in content) || content[field.key] === '' || content[field.key] == null) {
        errors.push(`Required field '${field.label}' is missing from template content`);
      }
    }

    // Validate field types and constraints
    for (const field of blockType.editableFields) {
      const value = content[field.key];
      if (value !== undefined && value !== null && value !== '') {
        const fieldValidation = this.validateTemplateField(field, value);
        if (!fieldValidation.isValid) {
          errors.push(`Template content field '${field.label}': ${fieldValidation.message}`);
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate individual template field
   */
  private static validateTemplateField(
    field: any,
    value: any
  ): { isValid: boolean; message?: string } {
    // This would use the same validation logic as BlockValidator.validateField
    // For brevity, implementing basic validation here
    
    switch (field.type) {
      case 'text':
        if (typeof value !== 'string') {
          return { isValid: false, message: 'Must be a text value' };
        }
        if (field.maxLength && value.length > field.maxLength) {
          return { isValid: false, message: `Must be ${field.maxLength} characters or less` };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { isValid: false, message: 'Must be a valid number' };
        }
        break;

      case 'url':
        if (typeof value !== 'string') {
          return { isValid: false, message: 'Must be a text value' };
        }
        if (value && !value.match(/^https?:\/\/.+/)) {
          return { isValid: false, message: 'Must be a valid URL' };
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
}

// Utility functions for template management

/**
 * Get all available template categories
 */
export function getTemplateCategories(): TemplateCategory[] {
  return TEMPLATE_CATEGORIES;
}

/**
 * Get templates grouped by category
 */
export function getTemplatesGroupedByCategory(blockType?: string): Record<string, BlockTemplate[]> {
  let templates = BLOCK_TEMPLATES;
  
  if (blockType) {
    templates = templates.filter(t => t.blockType === blockType);
  }

  const grouped: Record<string, BlockTemplate[]> = {};
  
  TEMPLATE_CATEGORIES.forEach(category => {
    grouped[category.id] = templates.filter(t => t.category === category.id);
  });

  return grouped;
}

/**
 * Generate template ID for custom templates
 */
export function generateTemplateId(blockType: string, name: string): string {
  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const timestamp = Date.now();
  return `${blockType}_${sanitizedName}_${timestamp}`;
}

/**
 * Check if template supports responsive design
 * Requirements: 6.5 - Maintain responsive design across all device sizes
 */
export function isTemplateResponsive(templateId: string): boolean {
  const template = TemplateManager.getTemplate(templateId);
  if (!template) {
    return false;
  }

  // All templates are designed to be responsive by default
  // This function can be extended to check specific responsive features
  return true;
}

/**
 * Get responsive breakpoints for template styling
 */
export function getResponsiveBreakpoints(): Record<string, string> {
  return {
    mobile: '(max-width: 768px)',
    tablet: '(min-width: 769px) and (max-width: 1024px)',
    desktop: '(min-width: 1025px)',
    large: '(min-width: 1440px)'
  };
}