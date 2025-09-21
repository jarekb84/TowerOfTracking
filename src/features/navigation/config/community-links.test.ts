import { describe, expect, it } from 'vitest'
import { COMMUNITY_LINKS, createCommunityLinkClassName } from './community-links'

describe('Community Links Configuration', () => {
  describe('COMMUNITY_LINKS', () => {
    it('should contain Discord and GitHub links', () => {
      expect(COMMUNITY_LINKS).toHaveLength(2)
      
      const discordLink = COMMUNITY_LINKS.find(link => link.id === 'discord')
      const githubLink = COMMUNITY_LINKS.find(link => link.id === 'github')
      
      expect(discordLink).toBeDefined()
      expect(githubLink).toBeDefined()
    })

    it('should have correct Discord link configuration', () => {
      const discordLink = COMMUNITY_LINKS.find(link => link.id === 'discord')!
      
      expect(discordLink.label).toBe('Join Discord')
      expect(discordLink.href).toBe('https://discord.gg/J444xGFbTt')
      expect(discordLink.icon).toBe('discord')
      expect(discordLink.hoverColor).toBe('hover:text-purple-300')
      expect(discordLink.focusRingColor).toBe('focus-visible:ring-purple-400/50')
      expect(discordLink.ariaLabel).toBe('Join our Discord community')
      expect(discordLink.title).toBe('Join Discord')
    })

    it('should have correct GitHub link configuration', () => {
      const githubLink = COMMUNITY_LINKS.find(link => link.id === 'github')!
      
      expect(githubLink.label).toBe('View Source')
      expect(githubLink.href).toBe('https://github.com/jarekb84/TowerOfTracking')
      expect(githubLink.icon).toBe('github')
      expect(githubLink.hoverColor).toBe('hover:text-orange-300')
      expect(githubLink.focusRingColor).toBe('focus-visible:ring-orange-400/50')
      expect(githubLink.ariaLabel).toBe('View source code on GitHub')
      expect(githubLink.title).toBe('View on GitHub')
    })

    it('should have unique IDs for all links', () => {
      const ids = COMMUNITY_LINKS.map(link => link.id)
      const uniqueIds = [...new Set(ids)]
      expect(ids).toHaveLength(uniqueIds.length)
    })

    it('should have valid external URLs', () => {
      COMMUNITY_LINKS.forEach(link => {
        expect(link.href).toMatch(/^https:\/\//)
      })
    })

    it('should have consistent icon types', () => {
      COMMUNITY_LINKS.forEach(link => {
        expect(['discord', 'github']).toContain(link.icon)
      })
    })
  })

  describe('createCommunityLinkClassName', () => {
    it('should create correct class names for Discord link', () => {
      const discordLink = COMMUNITY_LINKS.find(link => link.id === 'discord')!
      const className = createCommunityLinkClassName(discordLink)
      
      expect(className).toContain('flex items-center justify-center w-9 h-9')
      expect(className).toContain('text-slate-400')
      expect(className).toContain('hover:text-purple-300')
      expect(className).toContain('hover:bg-purple-500/10')
      expect(className).toContain('transition-all duration-200')
      expect(className).toContain('focus-visible:ring-purple-400/50')
    })

    it('should create correct class names for GitHub link', () => {
      const githubLink = COMMUNITY_LINKS.find(link => link.id === 'github')!
      const className = createCommunityLinkClassName(githubLink)
      
      expect(className).toContain('flex items-center justify-center w-9 h-9')
      expect(className).toContain('text-slate-400')
      expect(className).toContain('hover:text-orange-300')
      expect(className).toContain('hover:bg-orange-500/10')
      expect(className).toContain('transition-all duration-200')
      expect(className).toContain('focus-visible:ring-orange-400/50')
    })

    it('should include all required base classes', () => {
      const link = COMMUNITY_LINKS[0]
      const className = createCommunityLinkClassName(link)
      
      expect(className).toContain('rounded-lg')
      expect(className).toContain('focus-visible:outline-none')
      expect(className).toContain('focus-visible:ring-2')
    })

    it('should handle different hover colors correctly', () => {
      const discordClassName = createCommunityLinkClassName(COMMUNITY_LINKS[0])
      const githubClassName = createCommunityLinkClassName(COMMUNITY_LINKS[1])
      
      expect(discordClassName).toContain('hover:text-purple-300')
      expect(githubClassName).toContain('hover:text-orange-300')
      expect(discordClassName).not.toContain('hover:text-orange-300')
      expect(githubClassName).not.toContain('hover:text-purple-300')
    })
  })
})