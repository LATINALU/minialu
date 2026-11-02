/*
Navicat MySQL Data Transfer

Source Server         : mf
Source Server Version : 50524
Source Host           : localhost:3306
Source Database       : mf_game

Target Server Type    : MYSQL
Target Server Version : 50524
File Encoding         : 65001

Date: 2023-10-11 19:52:33
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for adminuser
-- ----------------------------
DROP TABLE IF EXISTS `adminuser`;
CREATE TABLE `adminuser` (
  `UserIndex` varchar(30) NOT NULL,
  `UserPassword` varchar(50) NOT NULL,
  `CreateDate` datetime NOT NULL,
  `Notice` int(11) NOT NULL,
  `Startcastlewar` int(11) NOT NULL DEFAULT '0',
  `Stopcastlewar` int(11) NOT NULL DEFAULT '0',
  `Fillcard` int(11) NOT NULL DEFAULT '0',
  `Fillupcard` int(11) NOT NULL,
  `Fillawakecard` int(11) NOT NULL,
  `Fillfurycard` int(11) NOT NULL,
  `Giveitem` int(11) NOT NULL,
  `Grandarenastart` int(11) NOT NULL,
  `Incmoney` int(11) NOT NULL,
  `Setexp` int(11) NOT NULL,
  `Dropuser` int(11) NOT NULL,
  `Blockuser` int(11) NOT NULL,
  `NickName` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of adminuser
-- ----------------------------

-- ----------------------------
-- Table structure for carddata
-- ----------------------------
DROP TABLE IF EXISTS `carddata`;
CREATE TABLE `carddata` (
  `UserIndex` bigint(20) NOT NULL,
  `CardIndex` tinyint(4) unsigned DEFAULT NULL,
  `CardType` tinyint(4) unsigned DEFAULT NULL,
  `CardLevel` tinyint(4) unsigned DEFAULT NULL,
  `CharType` smallint(6) DEFAULT NULL,
  `Alphabet` char(1) DEFAULT NULL,
  `CardName` varchar(100) DEFAULT NULL,
  `HP` int(11) DEFAULT NULL,
  `MP` int(11) DEFAULT NULL,
  `HandAtt` int(11) DEFAULT NULL,
  `KickAtt` int(11) DEFAULT NULL,
  `Def` int(11) DEFAULT NULL,
  `PlayType` tinyint(4) unsigned DEFAULT NULL,
  `Mode` varchar(100) DEFAULT NULL,
  `CountIndex` bigint(20) NOT NULL DEFAULT '0',
  `CreateDate` datetime DEFAULT '2017-06-20 19:32:29',
  `UseDate` datetime DEFAULT '2017-06-20 19:32:29',
  `Enchant` tinyint(3) unsigned DEFAULT '0',
  `NewSkill1` tinyint(3) unsigned DEFAULT '0',
  `NewSkill2` tinyint(3) unsigned DEFAULT '0',
  `NewSkill3` tinyint(3) unsigned DEFAULT '0',
  `NewSkill4` tinyint(3) unsigned DEFAULT '0',
  `NewSkill5` tinyint(3) unsigned DEFAULT '0',
  `SkillPower` int(10) DEFAULT '0',
  `NewSkillPower` int(10) DEFAULT '0',
  `SpecialPower` int(10) DEFAULT '0',
  `FinalSpecialPower` int(11) DEFAULT '0',
  `CatchPower` int(11) DEFAULT '0',
  `CardLimitType` smallint(6) DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of carddata
-- ----------------------------

-- ----------------------------
-- Table structure for carddataindex
-- ----------------------------
DROP TABLE IF EXISTS `carddataindex`;
CREATE TABLE `carddataindex` (
  `CardIndex` bigint(20) NOT NULL DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of carddataindex
-- ----------------------------

-- ----------------------------
-- Table structure for equipinfo
-- ----------------------------
DROP TABLE IF EXISTS `equipinfo`;
CREATE TABLE `equipinfo` (
  `ItemIndex` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserIndex` bigint(20) unsigned NOT NULL,
  `CharType` smallint(6) NOT NULL,
  `EquipSlot` tinyint(3) unsigned NOT NULL,
  `ItemNumber` smallint(6) NOT NULL,
  `ItemCharacter` smallint(6) NOT NULL,
  `ItemCount` smallint(6) NOT NULL,
  `ItemLife` smallint(6) NOT NULL,
  `PunchPower` smallint(6) NOT NULL,
  `KickPower` smallint(6) NOT NULL,
  `Defence` smallint(6) NOT NULL,
  `HP` smallint(6) NOT NULL,
  `MP` smallint(6) NOT NULL,
  `Skill` smallint(6) NOT NULL,
  `AdvNSkill` smallint(6) NOT NULL,
  `Catch` smallint(6) NOT NULL,
  `ItemOption` varchar(512) NOT NULL,
  `BuyDate` datetime DEFAULT '2017-06-20 19:32:29',
  `ItemRealIndex` bigint(20) NOT NULL,
  PRIMARY KEY (`ItemIndex`),
  UNIQUE KEY `ItemIndex_UNIQUE` (`ItemIndex`)
) ENGINE=MyISAM AUTO_INCREMENT=16548 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of equipinfo
-- ----------------------------

-- ----------------------------
-- Table structure for frienddata
-- ----------------------------
DROP TABLE IF EXISTS `frienddata`;
CREATE TABLE `frienddata` (
  `UserIndex` bigint(20) unsigned NOT NULL,
  `FriendUserIndex` bigint(20) unsigned NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of frienddata
-- ----------------------------

-- ----------------------------
-- Table structure for guilddata
-- ----------------------------
DROP TABLE IF EXISTS `guilddata`;
CREATE TABLE `guilddata` (
  `GuildIndex` int(11) NOT NULL AUTO_INCREMENT,
  `GuildName` varchar(50) NOT NULL,
  `GuildPoint` int(11) NOT NULL DEFAULT '0',
  `Win` int(11) NOT NULL DEFAULT '0',
  `Lose` int(11) NOT NULL DEFAULT '0',
  `CafeName` varchar(50) NOT NULL DEFAULT '',
  `GuildMsg` varchar(300) NOT NULL DEFAULT '',
  PRIMARY KEY (`GuildIndex`),
  UNIQUE KEY `GuildIndex_UNIQUE` (`GuildIndex`)
) ENGINE=MyISAM AUTO_INCREMENT=17 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of guilddata
-- ----------------------------

-- ----------------------------
-- Table structure for guildmemberlist
-- ----------------------------
DROP TABLE IF EXISTS `guildmemberlist`;
CREATE TABLE `guildmemberlist` (
  `CountIndex` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `UserIndex` bigint(20) unsigned NOT NULL,
  `GuildIndex` int(11) NOT NULL,
  `Member` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `CreateDate` datetime DEFAULT '2017-06-20 19:32:29',
  PRIMARY KEY (`CountIndex`)
) ENGINE=MyISAM AUTO_INCREMENT=336 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of guildmemberlist
-- ----------------------------

-- ----------------------------
-- Table structure for iteminfo
-- ----------------------------
DROP TABLE IF EXISTS `iteminfo`;
CREATE TABLE `iteminfo` (
  `ItemIndex` bigint(20) NOT NULL AUTO_INCREMENT,
  `UserIndex` bigint(20) unsigned NOT NULL,
  `ItemInventory` tinyint(3) unsigned NOT NULL,
  `ItemSlot` smallint(6) NOT NULL,
  `ItemNumber` smallint(6) NOT NULL,
  `ItemCharacter` smallint(6) NOT NULL,
  `ItemCount` smallint(6) NOT NULL,
  `ItemLife` smallint(6) NOT NULL,
  `PunchPower` smallint(6) NOT NULL,
  `KickPower` smallint(6) NOT NULL,
  `Defence` smallint(6) NOT NULL,
  `HP` smallint(6) NOT NULL,
  `MP` smallint(6) NOT NULL,
  `Skill` smallint(6) NOT NULL,
  `AdvNSkill` smallint(6) NOT NULL,
  `Catch` smallint(6) NOT NULL,
  `ItemOption` varchar(512) NOT NULL,
  `BuyDate` datetime DEFAULT '2017-06-20 19:32:29',
  `ItemRealIndex` bigint(20) NOT NULL,
  PRIMARY KEY (`ItemIndex`),
  UNIQUE KEY `ItemIndex_UNIQUE` (`ItemIndex`)
) ENGINE=MyISAM AUTO_INCREMENT=35497 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of iteminfo
-- ----------------------------

-- ----------------------------
-- Table structure for iteminfoindex
-- ----------------------------
DROP TABLE IF EXISTS `iteminfoindex`;
CREATE TABLE `iteminfoindex` (
  `ItemIndex` bigint(20) NOT NULL DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of iteminfoindex
-- ----------------------------

-- ----------------------------
-- Table structure for mail
-- ----------------------------
DROP TABLE IF EXISTS `mail`;
CREATE TABLE `mail` (
  `UserIndex` bigint(20) DEFAULT NULL,
  `id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of mail
-- ----------------------------

-- ----------------------------
-- Table structure for mychardata
-- ----------------------------
DROP TABLE IF EXISTS `mychardata`;
CREATE TABLE `mychardata` (
  `UserIndex` bigint(20) NOT NULL,
  `CardIndex` tinyint(4) unsigned DEFAULT NULL,
  `CardType` tinyint(4) unsigned DEFAULT NULL,
  `CardLevel` tinyint(4) unsigned DEFAULT NULL,
  `CharType` smallint(6) DEFAULT NULL,
  `Alphabet` char(1) DEFAULT NULL,
  `CardName` varchar(100) DEFAULT NULL,
  `HP` int(11) DEFAULT NULL,
  `MP` int(11) DEFAULT NULL,
  `HandAtt` int(11) DEFAULT NULL,
  `KickAtt` int(11) DEFAULT NULL,
  `Def` int(11) DEFAULT NULL,
  `PlayType` tinyint(4) unsigned DEFAULT NULL,
  `Mode` varchar(100) DEFAULT NULL,
  `CountIndex` bigint(20) NOT NULL DEFAULT '0',
  `CreateDate` datetime DEFAULT '2017-06-20 19:32:29',
  `UseDate` datetime DEFAULT '2017-06-20 19:32:29',
  `Enchant` tinyint(3) unsigned DEFAULT '0',
  `NewSkill1` tinyint(3) unsigned DEFAULT '0',
  `NewSkill2` tinyint(3) unsigned DEFAULT '0',
  `NewSkill3` tinyint(3) unsigned DEFAULT '0',
  `NewSkill4` tinyint(3) unsigned DEFAULT '0',
  `NewSkill5` tinyint(3) unsigned DEFAULT '0',
  `SkillPower` int(10) DEFAULT '0',
  `NewSkillPower` int(10) DEFAULT '0',
  `SpecialPower` int(10) DEFAULT '0',
  `FinalSpecialPower` int(11) DEFAULT '0',
  `CatchPower` int(11) DEFAULT '0',
  `CardLimitType` smallint(6) DEFAULT '0'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of mychardata
-- ----------------------------

-- ----------------------------
-- Table structure for questdata
-- ----------------------------
DROP TABLE IF EXISTS `questdata`;
CREATE TABLE `questdata` (
  `UserIndex` bigint(20) NOT NULL,
  `DoQuest` tinyint(4) NOT NULL,
  `QuestIndex` int(11) NOT NULL,
  `WorkCount` varchar(255) NOT NULL,
  `EnableQuestPerNPC` varchar(255) NOT NULL,
  `CountMob` varchar(255) NOT NULL,
  `Notice` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`UserIndex`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- ----------------------------
-- Records of questdata
-- ----------------------------

-- ----------------------------
-- Table structure for userinfo
-- ----------------------------
DROP TABLE IF EXISTS `userinfo`;
CREATE TABLE `userinfo` (
  `UserIndex` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `UserID` text NOT NULL,
  `UserPassword` text NOT NULL,
  `NickName` varchar(100) DEFAULT NULL,
  `IsBlocked` tinyint(3) unsigned NOT NULL DEFAULT '0',
  `BirthDay` int(11) DEFAULT '19000101',
  `Sex` tinyint(4) unsigned DEFAULT '0',
  `CreateDate` datetime DEFAULT '2017-06-20 19:32:29',
  `Cash` int(11) NOT NULL DEFAULT '0',
  `SessionIP` varchar(45) NOT NULL DEFAULT '',
  `RegisterIP` varchar(45) NOT NULL DEFAULT '',
  PRIMARY KEY (`UserIndex`)
) ENGINE=MyISAM AUTO_INCREMENT=3220 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of userinfo
-- ----------------------------

-- ----------------------------
-- Table structure for userinfovariable
-- ----------------------------
DROP TABLE IF EXISTS `userinfovariable`;
CREATE TABLE `userinfovariable` (
  `UserIndex` bigint(20) NOT NULL,
  `Experience` bigint(20) NOT NULL DEFAULT '0',
  `BattleExperience` bigint(20) NOT NULL DEFAULT '0',
  `UserLevel` smallint(6) NOT NULL DEFAULT '1',
  `Win` int(11) NOT NULL DEFAULT '0',
  `Lose` int(11) NOT NULL DEFAULT '0',
  `Coin` bigint(20) NOT NULL DEFAULT '0',
  `CurrentChar` tinyint(4) unsigned NOT NULL DEFAULT '0',
  `UserZone` smallint(6) NOT NULL DEFAULT '0',
  `PosX` smallint(6) NOT NULL DEFAULT '0',
  `PosY` smallint(6) NOT NULL DEFAULT '0',
  `Tutorial` smallint(6) NOT NULL DEFAULT '0',
  `MaxCharSlot` tinyint(4) unsigned NOT NULL DEFAULT '10',
  `ConnectChannel` int(11) NOT NULL DEFAULT '-1',
  `LastLogoutDate` datetime DEFAULT '2017-06-20 19:32:29',
  `FightExp` bigint(20) NOT NULL DEFAULT '0',
  `RemainingSP` int(11) NOT NULL DEFAULT '0',
  `TotalSP` int(11) NOT NULL DEFAULT '0',
  `SkillData` varchar(4096) NOT NULL DEFAULT '',
  `DungeonExperience` bigint(20) NOT NULL DEFAULT '0',
  `HighestLevel` smallint(6) NOT NULL DEFAULT '0',
  PRIMARY KEY (`UserIndex`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of userinfovariable
-- ----------------------------
