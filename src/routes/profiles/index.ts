import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    return fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: request.params.id,
      });

      if (!profile) throw fastify.httpErrors.notFound();
      return profile;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const {
        body: { userId, memberTypeId },
      } = request;

      const user = fastify.db.users.findOne({ key: 'id', equals: userId });

      const profile = await fastify.db.profiles.findOne({
        key: 'userId',
        equals: userId,
      });

      if (profile) throw fastify.httpErrors.badRequest();

      if (!(memberTypeId === 'basic' || memberTypeId === 'business'))
        throw fastify.httpErrors.badRequest();

      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: memberTypeId,
      });

      if (!(user || memberType)) throw fastify.httpErrors.badRequest();

      return fastify.db.profiles.create(request.body);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id } = request.params;

      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: id,
      });

      if (!profile) throw fastify.httpErrors.badRequest();

      return fastify.db.profiles.delete(id);
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const {
        body,
        params: { id },
      } = request;

      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: id,
      });

      if (!profile) throw fastify.httpErrors.badRequest();

      try {
        return fastify.db.profiles.change(id, body);
      } catch {
        throw fastify.httpErrors.badRequest();
      }
    }
  );
};

export default plugin;
